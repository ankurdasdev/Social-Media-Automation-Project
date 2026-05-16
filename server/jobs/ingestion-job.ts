import { query, queryOne } from "../db/index";
import { upsertContact } from "../store/contacts-store";
import {
  getGroupMessages as getWAMessages,
  getMessageBase64,
  extractMessageText,
} from "../services/whatsapp-client";
import {
  getAccountPosts,
  getHashtagPosts,
  getGroupMessages as getIGGroupMessages,
} from "../services/instagram-client";
import { parseMessages, RawMessage } from "../services/ai-parser";
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
        const waInstance = await queryOne(
          "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
          [userId]
        );
        const igSession = await queryOne(
          "SELECT session_data FROM instagram_sessions WHERE user_id = $1",
          [userId]
        );

        // 3. Fetch User's Enabled Groups & Keywords
        const groups = await query(
          "SELECT * FROM source_groups WHERE user_id = $1 AND enabled = TRUE",
          [userId]
        );
        const userRow = await queryOne<{ ai_keywords: any[] }>(
          "SELECT ai_keywords FROM users WHERE id = $1",
          [userId]
        );
        const activeKeywords: string[] = (userRow?.ai_keywords || [])
          .filter((k: any) => k.active)
          .map((k: any) => k.word.toLowerCase());

        console.log(
          `[ingestion] User ${userId}: ${groups.length} groups, ${activeKeywords.length} keywords`
        );

        const userMessages: RawMessage[] = [];

        for (const grp of groups) {
          try {
            // ── WhatsApp Groups ─────────────────────────────────────────────
            if (grp.platform === "whatsapp") {
              if (!waInstance) { errors.push(`User ${userId}: No WA instance for group ${grp.name}`); continue; }

              const jidMatch = grp.url?.match(/jid:([^,\s]+)/);
              const groupJid = jidMatch ? jidMatch[1] : null;
              if (!groupJid) { errors.push(`User ${userId}: No JID for group ${grp.name}`); continue; }

              const rawMsgs = await getWAMessages(waInstance.instance_name, groupJid, since);
              messagesScanned += rawMsgs.length;
              sourcesProcessed++;

              console.log(`[ingestion] Group "${grp.name}": ${rawMsgs.length} messages`);

              for (const m of rawMsgs) {
                const msgType = m.messageType;

                // ── Text Messages ──
                if (msgType === "conversation" || msgType === "extendedTextMessage") {
                  const text = extractMessageText(m);
                  if (text.trim().length >= 20) {
                    userMessages.push({ text, source: "whatsapp" });
                  }
                }
                // ── Image Messages (casting flyers) ──
                else if (msgType === "imageMessage") {
                  const caption = m.message?.imageMessage?.caption || "";

                  // Quick keyword check on caption before expensive image download
                  const captionLower = caption.toLowerCase();
                  const captionMatchesKeyword =
                    activeKeywords.length === 0 ||
                    activeKeywords.some((kw) => captionLower.includes(kw));

                  // If caption is long enough and doesn't match any keyword, skip image
                  if (caption.length > 30 && !captionMatchesKeyword) continue;

                  // Download image for vision analysis
                  const mediaData = await getMessageBase64(waInstance.instance_name, m);
                  if (mediaData) {
                    userMessages.push({
                      imageBase64: mediaData.base64,
                      imageMimetype: mediaData.mimetype,
                      imageCaption: caption,
                      source: "whatsapp",
                    });
                  }
                }
              }
            }

            // ── Instagram Groups / Hashtags ─────────────────────────────────
            else if (grp.platform === "instagram") {
              if (!igSession?.session_data) { errors.push(`User ${userId}: No IG session for group ${grp.name}`); continue; }
              const session = igSession.session_data;
              sourcesProcessed++;

              if (grp.type === "hashtag") {
                const posts = await getHashtagPosts(grp.name.replace("#", ""), since, session);
                messagesScanned += posts.length;
                for (const p of posts) {
                  if (p.caption_text?.trim().length >= 20) {
                    userMessages.push({ text: p.caption_text, source: "instagram" });
                  }
                }
              } else if (grp.type === "group") {
                const threadMatch = grp.url?.match(/thread:([^,\s]+)/);
                if (threadMatch) {
                  const msgs = await getIGGroupMessages(threadMatch[1], since, session);
                  messagesScanned += msgs.length;
                  for (const m of msgs) {
                    if (m.text?.trim().length >= 20) {
                      userMessages.push({ text: m.text, source: "instagram" });
                    }
                  }
                }
              } else {
                const posts = await getAccountPosts(grp.name.replace("@", ""), since, session);
                messagesScanned += posts.length;
                for (const p of posts) {
                  if (p.caption_text?.trim().length >= 20) {
                    userMessages.push({ text: p.caption_text, source: "instagram" });
                  }
                }
              }
            }
          } catch (e: any) {
            errors.push(`User ${userId} - Group "${grp.name}": ${e.message}`);
          }
        }

        // 4. Batch AI Parsing (text + vision, with keywords)
        console.log(`[ingestion] User ${userId}: Sending ${userMessages.length} messages to AI...`);
        if (userMessages.length > 0) {
          const parsed = await parseMessages(userMessages, activeKeywords);
          castingCallsFound += parsed.length;
          console.log(`[ingestion] User ${userId}: ${parsed.length} casting calls identified`);

          // 5. Upsert Contacts
          for (const p of parsed) {
            const source = p.originalText?.startsWith("[image]")
              ? "auto-whatsapp"
              : userMessages.find(
                  (m) =>
                    m.text === p.originalText ||
                    m.imageCaption === p.originalText
                )?.source === "instagram"
              ? "auto-instagram"
              : "auto-whatsapp";

            const result = await upsertContact(
              userId,
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
              source as any
            );

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
  console.log("[ingestion] Job complete:", result);
  return result;
}
