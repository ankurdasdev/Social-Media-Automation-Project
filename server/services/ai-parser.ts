/**
 * AI Parser — OpenRouter (Text + Vision)
 *
 * Uses two models:
 *  - Text model: OPENROUTER_MODEL (for text messages)
 *  - Vision model: OPENROUTER_VISION_MODEL (for image flyers)
 *
 * Keywords are PREFERRED but NOT mandatory:
 *  - For text: only skip if keywords exist AND text is short AND has zero keyword hits
 *  - For images: keywords guide the AI but never hard-block the call
 */

import OpenAI from "openai";

const TEXT_MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-flash-1.5";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "dummy_key_to_prevent_startup_crash",
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:8080",
    "X-Title": "CastHub Ingestion",
  },
});

// ─── Helpers: Retry & JSON Extraction ─────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`[ai-parser] OpenAI API error: ${err.message}. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

function extractJsonObject(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in response");
  return JSON.parse(match[0]);
}

function extractJsonArray(text: string): any[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");
  return JSON.parse(match[0]);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedContact {
  isCastingCall: boolean;
  name: string;
  castingName: string;
  project: string;
  age: string;
  actingContext: string;
  whatsapp: string;
  email: string;
  instaHandle: string;
  notes: string;
  originalText?: string;
}

export interface ParsedMultipleContact {
  name: string;
  castingName: string;
  whatsapp: string;
  email: string;
  instaHandle: string;
  actingContext: string;
  project: string;
  age: string;
}

// ─── System Prompt (text messages) ───────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert assistant that extracts casting call information from WhatsApp and Instagram messages for an Indian actor's outreach app.

Your job is to read a message and return a JSON object with these exact fields:
- isCastingCall: boolean — true ONLY if this is a genuine casting call, audition announcement, or talent requirement. Be generous. If it looks like a requirement, mark true.
- name: string — name of the casting director, production house, or person/brand posting
- castingName: string — the role or casting title being sought (e.g. "Female Model", "Actor - Lead Role")
- project: string — type or name of project (e.g. "Web Series", "TVC", "Ad Campaign", "Film", "OTT Show")
- age: string — age range required (e.g. "18-25") or "" if not mentioned
- actingContext: string — context like "Film & Web", "Commercials", "OTT", "Modelling", "Theatre" or ""
- whatsapp: string — phone number if mentioned (with country code if possible) or ""
- email: string — email address if mentioned or ""
- instaHandle: string — Instagram handle if mentioned (with @) or ""
- notes: string — brief notes of location, shoot dates, payment, deadlines (max 150 chars)

Rules:
- The AI profiling keywords are preferences ONLY. They are not mandatory. Do not skip casting calls just because keywords don't match.
- If the message is completely irrelevant (spam, news, personal chatter), return isCastingCall: false with all other fields as "".
- Return ONLY valid JSON, no markdown code blocks, no explanation.
- Keep all text fields concise (max 100 chars each except notes).
- For Indian content: Bollywood, OTT, regional films, TVC, brand shoots are common contexts.`;

// ─── Text Message Parser ──────────────────────────────────────────────────────

export async function parseMessage(
  rawText: string,
  source: "whatsapp" | "instagram",
  keywords: string[] = []
): Promise<ParsedContact | null> {
  if (!rawText || rawText.trim().length < 20) return null;

  // We removed the hard-filter for short messages to ensure we don't miss anything.

  const keywordHint =
    keywords.length > 0
      ? `\nUser's preferred keywords (for context, not a hard filter): ${keywords.join(", ")}`
      : "";

  const userPrompt = `Platform: ${source}${keywordHint}\nMessage:\n${rawText.slice(0, 2500)}`;

  try {
    const response = await withRetry(() => client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }));

    const content = response.choices[0]?.message?.content ?? "";
    const parsed: ParsedContact = extractJsonObject(content);
    if (!parsed.isCastingCall) return null;
    return parsed;
  } catch (err) {
    console.error("[ai-parser] Text parse failed:", err);
    return null;
  }
}

// ─── Vision / Image Parser (single contact, legacy) ──────────────────────────

export async function parseImage(
  base64: string,
  mimetype: string,
  caption: string = "",
  keywords: string[] = []
): Promise<ParsedContact | null> {
  // Never hard-block images purely on keyword grounds —
  // the vision model will read the full flyer
  const dataUrl = `data:${mimetype};base64,${base64.slice(0, 300000)}`;

  const keywordHint =
    keywords.length > 0
      ? `User's preferred keywords (for context, not a strict filter): ${keywords.join(", ")}. Include the casting call even if keywords are not an exact match.`
      : "Include any casting call or talent requirement found in the image.";

  try {
    const response = await withRetry(() => client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text" as const,
              text: `${keywordHint}${caption ? `\nCaption: ${caption}` : ""}\nAnalyze this image and extract casting call details if present. Return only valid JSON.`,
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 600,
    }));

    const content = response.choices[0]?.message?.content ?? "";
    const parsed: ParsedContact = extractJsonObject(content);
    if (!parsed.isCastingCall) return null;
    return parsed;
  } catch (err) {
    console.error("[ai-parser] Vision parse failed:", err);
    return null;
  }
}

// ─── Multi-Contact Image Parser (primary path for casting flyers) ─────────────

/**
 * Analyze a casting flyer for ALL contacts it contains.
 * A single flyer may list one or many phone numbers / emails — each becomes a row.
 * Keywords are passed as soft context to the AI, not a mandatory filter.
 */
export async function parseCastingImageForMultipleContacts(
  base64: string,
  mimetype: string,
  userKeywords: string[] = [],
  userGender: string = ""
): Promise<ParsedMultipleContact[]> {
  const dataUrl = `data:${mimetype};base64,${base64.slice(0, 300000)}`;

  // Build soft profile context — always prefer to include rather than exclude
  let profileContext: string;
  if (userKeywords.length > 0) {
    profileContext = `The user's preferred casting keywords are: ${userKeywords.join(", ")}. These are PREFERENCES ONLY. They are NOT mandatory. You must STILL EXTRACT the contact information even if it does not match the keywords. Never exclude a valid casting call.`;
  } else if (userGender) {
    profileContext = `The user's gender is: ${userGender}. Prefer casting calls relevant to this gender, but you MUST include all others too.`;
  } else {
    profileContext = `No profile keywords available. Include ALL casting calls and talent requirements found in the image.`;
  }

  const dynamicPrompt = `You are an expert data extraction assistant for an Indian actor's outreach app.
Your job is to read an image (which may be a casting call flyer, WhatsApp forward, or talent requirement post) and extract contact information into a structured JSON array. The image may contain one single contact OR multiple contacts. It is completely generic.

USER PROFILE CONTEXT:
${profileContext}

Extract these fields for EACH contact found in the image:
- name: string — name of the casting director, production house, or brand posting (e.g. "PosterMyWall Ent", "Ravi Casting")
- castingName: string — the casting agency or most prominent company name in the image
- whatsapp: string — phone number if visible (digits only, no country code prefix unless shown)
- email: string — email address if visible, else ""
- instaHandle: string — Instagram handle with @ if visible, else ""
- actingContext: string — MAX 2 WORDS, e.g. "Male Role", "Female Model", "Lead Actor", "Brand Shoot"
- project: string — MAX 2 WORDS, e.g. "Web Series", "TV Ad", "Movie", "OTT Show"
- age: string — age range if mentioned (e.g. "24-28", "22-30 yrs"), else ""

CRITICAL RULES:
- The image may contain ONE contact or MULTIPLE contacts — process it generically and return all of them.
- If there are MULTIPLE distinct phone numbers, emails, or Instagram handles, create a SEPARATE row for each distinct contact method.
- If 1 WhatsApp + 1 Email belong to the same casting: put them in ONE row.
- If 2 WhatsApps + 1 Email: Row 1 = WA#1 + Email, Row 2 = WA#2 + empty email.
- Do NOT add country code "91" yourself if it is not shown in the image.
- If the image contains no casting call at all, return an empty array [].
- Return ONLY a valid JSON array of objects. No markdown, no explanation, no extra text.

Example Output:
[
  {
    "name": "Vikram Kapoor",
    "castingName": "Mukesh Chhabra Casting",
    "whatsapp": "9876543210",
    "email": "casting@mcc.com",
    "instaHandle": "@mccasting",
    "actingContext": "Lead Role",
    "project": "Web Series",
    "age": "24-30"
  },
  {
    "name": "Vikram Kapoor",
    "castingName": "Mukesh Chhabra Casting",
    "whatsapp": "9123456789",
    "email": "",
    "instaHandle": "",
    "actingContext": "Lead Role",
    "project": "Web Series",
    "age": "24-30"
  }
]`;

  try {
    const response = await withRetry(() => client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        { role: "system", content: dynamicPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text" as const,
              text: "Extract all casting call contact details from this image. Return only the JSON array.",
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }));

    const content = response.choices[0]?.message?.content ?? "";
    
    // Quick escape if model explicitly says empty array
    if (content.trim() === "[]") return [];

    const parsed: ParsedMultipleContact[] = extractJsonArray(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[ai-parser] Multiple Contacts Vision parse failed:", err);
    throw err;
  }
}

// ─── Batch Message Types ──────────────────────────────────────────────────────

export interface RawMessage {
  text?: string;
  imageBase64?: string;
  imageMimetype?: string;
  imageCaption?: string;
  source: "whatsapp" | "instagram";
}

/**
 * Batch parse a list of text messages only (legacy overload).
 */
export async function parseMessages(
  messages: Array<{ text: string; source: "whatsapp" | "instagram" }>,
  keywords?: string[]
): Promise<ParsedContact[]>;

export async function parseMessages(
  messages: RawMessage[],
  keywords?: string[]
): Promise<ParsedContact[]>;

export async function parseMessages(
  messages: any[],
  keywords: string[] = []
): Promise<ParsedContact[]> {
  const results: ParsedContact[] = [];

  for (const msg of messages) {
    let parsed: ParsedContact | null = null;

    if (msg.imageBase64) {
      // Vision path — single contact result (fallback; main job uses multi-contact path)
      parsed = await parseImage(
        msg.imageBase64,
        msg.imageMimetype || "image/jpeg",
        msg.imageCaption || "",
        keywords
      );
    } else if (msg.text) {
      parsed = await parseMessage(msg.text, msg.source, keywords);
    }

    if (parsed) {
      parsed.originalText = msg.text || msg.imageCaption || "[image]";
      results.push(parsed);
    }

    // Delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
}
