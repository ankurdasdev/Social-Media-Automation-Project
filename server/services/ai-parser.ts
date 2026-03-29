/**
 * AI Parser — OpenRouter
 *
 * Uses OpenRouter's free models (OpenAI-compatible API) to extract structured
 * casting contact data from raw WhatsApp/Instagram message text.
 *
 * SETUP:
 *  1. Sign up at https://openrouter.ai
 *  2. Settings → API Keys → Create Key
 *  3. Set env vars: OPENROUTER_API_KEY, OPENROUTER_MODEL
 *
 * Free models you can use (set as OPENROUTER_MODEL):
 *  - meta-llama/llama-3.1-8b-instruct:free   ← recommended
 *  - mistralai/mistral-7b-instruct:free
 *  - google/gemma-3-12b-it:free
 *
 * The openai npm package works with OpenRouter — just change baseURL and apiKey.
 */

import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:8080",
    "X-Title": "CastHub Ingestion",
  },
});

const MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedContact {
  isCastingCall: boolean;     // false → skip this message, not a casting call
  name: string;               // casting director / poster name
  castingName: string;        // role/casting title
  project: string;            // Film / Web Series / Ad / Commercial / etc.
  age: string;                // age range e.g. "22-30"
  actingContext: string;      // e.g. "Film & Web", "OTT"
  whatsapp: string;           // phone number if mentioned
  email: string;              // email if mentioned
  instaHandle: string;        // @handle if mentioned
  notes: string;              // any other key info (brief)
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert assistant that extracts casting call information from WhatsApp and Instagram messages for an Indian actor's outreach app.

Your job is to read a message and return a JSON object with these fields:
- isCastingCall: boolean — true ONLY if this is a genuine casting call or audition announcement
- name: string — name of the casting director, production house, or person posting
- castingName: string — the role or casting title being sought
- project: string — type or name of project (e.g. "Web Series", "Film", "Ad", "OTT Show")
- age: string — age range required (e.g. "24-32") or "" if not mentioned
- actingContext: string — context like "Film & Web", "Commercials", "OTT", "Theatre" or ""
- whatsapp: string — phone number if mentioned (with country code if possible) or ""
- email: string — email address if mentioned or ""
- instaHandle: string — Instagram handle if mentioned (with @) or ""
- notes: string — brief notes of any other important info (location, shoot dates, etc.)

Rules:
- If the message is NOT a casting call (e.g. general chatter, spam, news), return isCastingCall: false and leave all other fields as ""
- Return ONLY valid JSON, no markdown, no explanation
- Keep all text fields concise (max 100 chars each)
- For Indian content: Bollywood, OTT, regional films are common contexts`;

// ─── Main Parser Function ─────────────────────────────────────────────────────

/**
 * Parse a raw message/post text and extract casting contact data.
 * Returns null if the message is not a casting call.
 *
 * @param rawText - Plain text from a WhatsApp message or Instagram post caption
 * @param source  - "whatsapp" | "instagram" for context
 */
export async function parseMessage(
  rawText: string,
  source: "whatsapp" | "instagram"
): Promise<ParsedContact | null> {
  if (!rawText || rawText.trim().length < 20) {
    return null; // too short to be a casting call
  }

  const userPrompt = `Platform: ${source}\nMessage:\n${rawText.slice(0, 2000)}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1, // low temp for consistent structured output
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content ?? "";

    // Strip markdown code blocks if model wraps in ```json
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed: ParsedContact = JSON.parse(cleaned);

    if (!parsed.isCastingCall) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.error("[ai-parser] Failed to parse message:", err);
    return null;
  }
}

/**
 * Batch parse multiple messages. Processes sequentially to avoid rate limiting.
 * Returns only the successfully parsed casting calls.
 */
export async function parseMessages(
  messages: Array<{ text: string; source: "whatsapp" | "instagram" }>
): Promise<ParsedContact[]> {
  const results: ParsedContact[] = [];

  for (const msg of messages) {
    const parsed = await parseMessage(msg.text, msg.source);
    if (parsed) {
      results.push(parsed);
    }
    // Small delay to avoid rate limits on free tier
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}
