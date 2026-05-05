import { query, queryOne } from "../db/index";
import { upsertContact } from "../store/contacts-store";
import { getGroupMessages as getWAMessages, extractMessageText } from "../services/whatsapp-client";
import {
  getAccountPosts,
  getHashtagPosts,
  getGroupMessages as getIGGroupMessages,
} from "../services/instagram-client";
import { parseMessages } from "../services/ai-parser";
import type { IngestionRunResult } from "@shared/api";

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

export async function runIngestionJob(): Promise<IngestionRunResult> {
  if (isRunning) {
    console.log("[ingestion] Job already in progress. Skipping.");
    return lastRunResult || {
      runAt: new Date().toISOString(),
      durationMs: 0,
      sourcesProcessed: 0,
      messagesScanned: 0,
      castingCallsFound: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsSkipped: 0,
      errors: ["Already running"],
    };
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

  try {
    const since = get24hAgoTimestamp();
    
    // 1. Get all users who have enabled source groups
    const activeUsers = await query("SELECT DISTINCT user_id FROM source_groups WHERE enabled = TRUE");
    console.log(`[ingestion] Processing ${activeUsers.length} users...`);

    for (const { user_id: userId } of activeUsers) {
      try {
        console.log(`[ingestion] Processing User ID: ${userId}`);

        // 2. Fetch User's Integrations
        const waInstance = await queryOne("SELECT instance_name FROM whatsapp_instances WHERE user_id = $1 ", [userId]);
        const igSession = await queryOne("SELECT session_data FROM instagram_sessions WHERE user_id = $1 ", [userId]);

        // 3. Fetch User's Enabled Groups & Keywords
        const groups = await query("SELECT * FROM source_groups WHERE user_id = $1 AND enabled = TRUE", [userId]);
        const userRow = await queryOne<{ ai_keywords: any[] }>("SELECT ai_keywords FROM users WHERE id = $1", [userId]);
        const activeKeywords = (userRow?.ai_keywords || [])
          .filter((k: any) => k.active)
          .map((k: any) => k.word.toLowerCase());
        
        const userWAMessages: Array<{ text: string; source: "whatsapp" }> = [];
        const userIGMessages: Array<{ text: string; source: "instagram" }> = [];

        for (const grp of groups) {
          try {
            if (grp.platform === "whatsapp") {
              if (!waInstance) continue;
              const jidMatch = grp.url?.match(/jid:([^,\s]+)/);
              const groupJid = jidMatch ? jidMatch[1] : null;
              if (!groupJid) continue;

              const rawMsgs = await getWAMessages(waInstance.instance_name, groupJid, since);
              for (const m of rawMsgs) {
                const text = extractMessageText(m);
                if (text.trim().length >= 20) {
                  const lowerText = text.toLowerCase();
                  const matches = activeKeywords.length === 0 || activeKeywords.every(kw => lowerText.includes(kw));
                  if (matches) userWAMessages.push({ text, source: "whatsapp" });
                }
              }
              sourcesProcessed++;
              messagesScanned += rawMsgs.length;
            } 
            else if (grp.platform === "instagram") {
              if (!igSession?.session_data) continue;
              let posts: any[] = [];
              const session: string = igSession.session_data;

              if (grp.type === "hashtag") {
                posts = await getHashtagPosts(grp.name.replace("#", ""), since, session);
              } else if (grp.type === "group") {
                const threadMatch = grp.url?.match(/thread:([^,\s]+)/);
                if (threadMatch) {
                  const msgs = await getIGGroupMessages(threadMatch[1], since, session);
                  for (const m of msgs) {
                    if (m.text) userIGMessages.push({ text: m.text, source: "instagram" });
                  }
                  messagesScanned += msgs.length;
                }
              } else {
                posts = await getAccountPosts(grp.name.replace("@", ""), since, session);
              }

              for (const p of posts) {
                if (p.caption_text && p.caption_text.trim().length >= 20) {
                  const text = p.caption_text;
                  const lowerText = text.toLowerCase();
                  const matches = activeKeywords.length === 0 || activeKeywords.every(kw => lowerText.includes(kw));
                  if (matches) userIGMessages.push({ text, source: "instagram" });
                }
              }
              sourcesProcessed++;
              messagesScanned += posts.length;
            }
          } catch (e: any) {
            errors.push(`User ${userId} - Group ${grp.name}: ${e.message}`);
          }
        }

        // 4. Batch AI Parsing for User
        const allUserMessages = [...userWAMessages, ...userIGMessages];
        if (allUserMessages.length > 0) {
          const parsed = await parseMessages(allUserMessages);
          castingCallsFound += parsed.length;

          // 5. Upsert Contacts for User
          for (const p of parsed) {
            const source = userWAMessages.some(m => m.text === p.originalText) ? "auto-whatsapp" : "auto-instagram";
            const result = await upsertContact(userId, {
              name: p.name,
              castingName: p.castingName,
              project: p.project || "Casting Data",
              age: p.age,
              actingContext: p.actingContext,
              whatsapp: p.whatsapp,
              email: p.email,
              instaHandle: p.instaHandle,
              notes: p.notes,
            }, source as any);

            if (result.action === "created") contactsCreated++;
            else if (result.action === "updated") contactsUpdated++;
            else contactsSkipped++;
          }
        }
      } catch (e: any) {
        errors.push(`User ${userId} general error: ${e.message}`);
      }
    }
  } catch (e: any) {
    errors.push(`Critical job error: ${e.message}`);
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
  return result;
}
