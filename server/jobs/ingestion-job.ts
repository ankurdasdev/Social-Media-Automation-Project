/**
 * Daily Auto-Ingestion Job
 *
 * Orchestrates the full pipeline:
 *  1. Reads all enabled source groups from the registry
 *  2. Fetches last-24h messages from WhatsApp groups (Evolution API)
 *  3. Fetches last-24h posts from Instagram sources (instagrapi)
 *  4. Passes each message through the AI parser (OpenRouter)
 *  5. Upserts extracted contacts with yellow highlight
 *  6. Logs the run result
 *
 * Scheduled via node-cron: runs daily at midnight IST (18:30 UTC)
 * Can also be triggered manually via POST /api/ingestion/trigger
 */

import type { IngestionRunResult } from "@shared/api";
import type { SourceGroup } from "@shared/api";
import { getGroupsList } from "../routes/groups";
import { upsertContact } from "../store/contacts-store";
import { getGroupMessages as getWAMessages, extractMessageText } from "../services/whatsapp-client";
import {
  getAccountPosts,
  getHashtagPosts,
  getGroupMessages as getIGGroupMessages,
} from "../services/instagram-client";
import { parseMessages } from "../services/ai-parser";

// ─── State ────────────────────────────────────────────────────────────────────

let isRunning = false;
let lastRunResult: IngestionRunResult | null = null;

export function getIngestionState() {
  return { isRunning, lastRun: lastRunResult };
}

// ─── 24-Hour Window ───────────────────────────────────────────────────────────

function get24hAgoTimestamp(): number {
  return Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
}

// ─── Main Job ─────────────────────────────────────────────────────────────────

/**
 * Run the full ingestion pipeline for all enabled groups.
 * Safe to call multiple times — skips if already running.
 */
export async function runIngestionJob(): Promise<IngestionRunResult> {
  if (isRunning) {
    console.log("[ingestion] Already running, skipping...");
    return lastRunResult ?? ({
      runAt: new Date().toISOString(),
      durationMs: 0,
      sourcesProcessed: 0,
      messagesScanned: 0,
      castingCallsFound: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsSkipped: 0,
      errors: ["Job already running"],
    });
  }

  isRunning = true;
  const startTime = Date.now();
  const runAt = new Date().toISOString();
  const errors: string[] = [];

  let sourcesProcessed = 0;
  let messagesScanned = 0;
  let castingCallsFound = 0;
  let contactsCreated = 0;
  let contactsUpdated = 0;
  let contactsSkipped = 0;

  console.log("[ingestion] Starting daily ingestion run at", runAt);

  try {
    const since = get24hAgoTimestamp();
    const allGroups: SourceGroup[] = getGroupsList().filter((g) => g.enabled);

    const waGroups = allGroups.filter((g) => g.platform === "whatsapp");
    const igSources = allGroups.filter((g) => g.platform === "instagram");

    // ── WhatsApp Groups ──────────────────────────────────────────────────────
    const waMessages: Array<{ text: string; source: "whatsapp" }> = [];

    for (const group of waGroups) {
      try {
        // group.url holds the invite link; Evolution API needs the JID
        // The JID is stored in group.url as "jid:120363xxxx@g.us" prefix
        // OR we fall back to group name lookup via getGroups()
        const jidMatch = group.url?.match(/jid:([^,\s]+)/);
        if (!jidMatch) {
          errors.push(`WhatsApp group "${group.name}" has no JID set in URL field (use "jid:XXXXXXXX@g.us")`);
          continue;
        }
        const groupJid = jidMatch[1];

        console.log(`[ingestion] Fetching WA group: ${group.name} (${groupJid})`);
        const rawMsgs = await getWAMessages(groupJid, since);

        for (const msg of rawMsgs) {
          const text = extractMessageText(msg);
          if (text.trim().length >= 20) {
            waMessages.push({ text, source: "whatsapp" });
          }
        }

        sourcesProcessed++;
        messagesScanned += rawMsgs.length;
      } catch (err: any) {
        errors.push(`WA group "${group.name}": ${err.message}`);
      }
    }

    // ── Instagram Sources ────────────────────────────────────────────────────
    const igMessages: Array<{ text: string; source: "instagram" }> = [];

    for (const src of igSources) {
      try {
        let posts: Array<{ caption_text?: string; taken_at: number }> = [];

        if (src.type === "hashtag") {
          const tag = src.name.replace(/^#/, "");
          console.log(`[ingestion] Fetching IG hashtag: #${tag}`);
          posts = await getHashtagPosts(tag, since);
        } else if (src.type === "group") {
          // DM group — URL should hold the thread ID: "thread:XXXXXXXX"
          const threadMatch = src.url?.match(/thread:([^,\s]+)/);
          if (!threadMatch) {
            errors.push(`IG group "${src.name}" has no thread ID set in URL field (use "thread:XXXXXXXX")`);
            continue;
          }
          console.log(`[ingestion] Fetching IG DM thread: ${src.name}`);
          const msgs = await getIGGroupMessages(threadMatch[1], since);
          for (const m of msgs) {
            if (m.text) igMessages.push({ text: m.text, source: "instagram" });
          }
          sourcesProcessed++;
          messagesScanned += msgs.length;
          continue;
        } else {
          // account type
          const username = src.name.replace(/^@/, "");
          console.log(`[ingestion] Fetching IG account: @${username}`);
          posts = await getAccountPosts(username, since);
        }

        for (const post of posts) {
          if (post.caption_text && post.caption_text.trim().length >= 20) {
            igMessages.push({ text: post.caption_text, source: "instagram" });
          }
        }

        sourcesProcessed++;
        messagesScanned += posts.length;
      } catch (err: any) {
        errors.push(`IG source "${src.name}": ${err.message}`);
      }
    }

    // ── AI Parsing ───────────────────────────────────────────────────────────
    const allMessages = [...waMessages, ...igMessages];
    console.log(`[ingestion] Parsing ${allMessages.length} messages with AI...`);

    const parsed = await parseMessages(allMessages);
    castingCallsFound = parsed.length;

    console.log(`[ingestion] Found ${castingCallsFound} casting calls. Upserting contacts...`);

    // ── Upsert Contacts ──────────────────────────────────────────────────────
    for (const p of parsed) {
      const source = waMessages.some((m) => m.source === "whatsapp")
        ? "auto-whatsapp"
        : "auto-instagram";

      const result = upsertContact(
        {
          name: p.name,
          castingName: p.castingName,
          project: p.project || "Casting Data",
          age: p.age,
          actingContext: p.actingContext,
          whatsapp: p.whatsapp,
          email: p.email,
          instaHandle: p.instaHandle,
          notes: p.notes,
        },
        source as "auto-whatsapp" | "auto-instagram"
      );

      if (result.action === "created") contactsCreated++;
      else if (result.action === "updated") contactsUpdated++;
      else contactsSkipped++;
    }
  } catch (err: any) {
    errors.push(`Fatal: ${err.message}`);
    console.error("[ingestion] Fatal error:", err);
  } finally {
    isRunning = false;
  }

  const result: IngestionRunResult = {
    runAt,
    durationMs: Date.now() - startTime,
    sourcesProcessed,
    messagesScanned,
    castingCallsFound,
    contactsCreated,
    contactsUpdated,
    contactsSkipped,
    errors,
  };

  lastRunResult = result;
  console.log("[ingestion] Run complete:", result);

  return result;
}
