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
  getThreads as getIGThreads,
} from "../services/instagram-client";
import { parseMessages, RawMessage } from "../services/ai-parser";
import type { IngestionRunResult } from "@shared/api";

// ─── State ────────────────────────────────────────────────────────────────────

let isRunning = false;
let lastRunResult: IngestionRunResult | null = null;

export function getIngestionState() {
  return { isRunning, lastRun: lastRunResult };
}

// ─── Configurable Scan Window ────────────────────────────────────────────────

function getSinceTimestamp(sinceHours: number): number {
  return Math.floor((Date.now() - sinceHours * 60 * 60 * 1000) / 1000);
}

// ─── Main Job ─────────────────────────────────────────────────────────────────

export async function runIngestionJob(sinceHours: number = 24): Promise<IngestionRunResult> {
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
    const since = getSinceTimestamp(sinceHours);
    console.log(`[ingestion] Scanning messages from the last ${sinceHours}h (since ${new Date(since * 1000).toISOString()})...`);

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

        let igThreadsMap: Record<string, any> = {};
        if (igSession?.session_data) {
          try {
            console.log(`[ingestion] Pre-fetching IG threads for user ${userId} to check activity timestamps...`);
            const igThreads = await getIGThreads(igSession.session_data, 100);
            for (const t of igThreads || []) {
               igThreadsMap[t.id] = t;
            }
          } catch (err: any) {
             console.error(`[ingestion] Failed to pre-fetch IG threads:`, err.message);
          }
        }

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
                  const threadId = threadMatch[1];
                  const thread = igThreadsMap[threadId];
                  
                  // Check activity timestamp to avoid rate limits
                  let shouldFetch = true;
                  if (thread) {
                    // Instagram timestamps can be numeric epoch or ISO string depending on instagrapi format
                    let lastActivityAt = 0;
                    if (thread.last_activity_at) {
                      lastActivityAt = new Date(thread.last_activity_at).getTime();
                    } else if (thread.last_permanent_item?.timestamp) {
                      // Some items use microseconds timestamp
                      lastActivityAt = Number(thread.last_permanent_item.timestamp) / 1000;
                    }

                    const lastScrapedAt = grp.last_scraped ? new Date(grp.last_scraped).getTime() : 0;
                    if (lastActivityAt && lastActivityAt <= lastScrapedAt) {
                      console.log(`[ingestion] Skipping IG group "${grp.name}" - no new activity since last scrape.`);
                      shouldFetch = false;
                    }
                  }

                  if (shouldFetch) {
                    console.log(`[ingestion] Fetching messages for IG group "${grp.name}"... (sleeping to avoid rate-limits)`);
                    // Sleep 10-20 seconds to avoid ban
                    const sleepMs = Math.floor(Math.random() * 10000) + 10000;
                    await new Promise(r => setTimeout(r, sleepMs));

                    const msgs = await getIGGroupMessages(threadId, since, session);
                    messagesScanned += msgs.length;
                    for (const m of msgs) {
                      if (m.text?.trim().length >= 20) {
                        userMessages.push({ text: m.text, source: "instagram" });
                      }
                    }
                    
                    // Update last_scraped
                    await query("UPDATE source_groups SET last_scraped = NOW() WHERE id = $1", [grp.id]);
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
