/**
 * AI Parser — OpenRouter (Text + Vision)
 *
 * Uses two models:
 *  - Text model: OPENROUTER_MODEL (for text messages)
 *  - Vision model: OPENROUTER_VISION_MODEL (for image flyers, defaults to google/gemini-flash-1.5)
 *
 * Both are accessed via the OpenAI-compatible OpenRouter API.
 */

import OpenAI from "openai";

const TEXT_MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-flash-1.5";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:8080",
    "X-Title": "CastHub Ingestion",
  },
});

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

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert assistant that extracts casting call information from WhatsApp and Instagram messages for an Indian actor's outreach app.

Your job is to read a message (or analyze an image of a casting flyer) and return a JSON object with these exact fields:
- isCastingCall: boolean — true ONLY if this is a genuine casting call, audition announcement, or talent requirement
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
- If the message is NOT a casting call (general chatter, spam, event promotions, news, personal messages), return isCastingCall: false with all other fields as ""
- Return ONLY valid JSON, no markdown code blocks, no explanation
- Keep all text fields concise (max 100 chars each except notes)
- For Indian content: Bollywood, OTT, regional films, TVC, brand shoots are common contexts
- If analyzing an image: read all visible text carefully, treat it as a casting flyer`;

// ─── Text Message Parser ──────────────────────────────────────────────────────

export async function parseMessage(
  rawText: string,
  source: "whatsapp" | "instagram",
  keywords: string[] = []
): Promise<ParsedContact | null> {
  if (!rawText || rawText.trim().length < 20) return null;

  // Pre-filter with keywords if provided (must contain at least one)
  if (keywords.length > 0) {
    const lower = rawText.toLowerCase();
    const hasKeyword = keywords.some((kw) => lower.includes(kw.toLowerCase()));
    if (!hasKeyword) return null;
  }

  const userPrompt = `Platform: ${source}\nMessage:\n${rawText.slice(0, 2500)}`;

  try {
    const response = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: ParsedContact = JSON.parse(cleaned);
    if (!parsed.isCastingCall) return null;
    return parsed;
  } catch (err) {
    console.error("[ai-parser] Text parse failed:", err);
    return null;
  }
}

// ─── Vision / Image Parser ────────────────────────────────────────────────────

/**
 * Analyze a casting flyer image using a vision-capable model.
 * @param base64 - Raw base64 image data (no data: prefix)
 * @param mimetype - e.g. "image/jpeg"
 * @param caption - Optional caption text alongside the image
 * @param keywords - User's AI profiling keywords for pre-filtering
 */
export async function parseImage(
  base64: string,
  mimetype: string,
  caption: string = "",
  keywords: string[] = []
): Promise<ParsedContact | null> {
  // If we have a caption and keywords, do a quick text pre-check first
  if (caption && keywords.length > 0) {
    const lower = caption.toLowerCase();
    const hasKeyword = keywords.some((kw) => lower.includes(kw.toLowerCase()));
    // If caption clearly doesn't match AND is long enough to be conclusive, skip
    if (!hasKeyword && caption.length > 50) return null;
  }

  const dataUrl = `data:${mimetype};base64,${base64.slice(0, 300000)}`; // OpenRouter limit ~300KB

  try {
    const response = await client.chat.completions.create({
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
            ...(caption
              ? [{ type: "text" as const, text: `Caption text: ${caption}` }]
              : [{ type: "text" as const, text: "Analyze this image and extract casting call details if present." }]),
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: ParsedContact = JSON.parse(cleaned);
    if (!parsed.isCastingCall) return null;
    return parsed;
  } catch (err) {
    console.error("[ai-parser] Vision parse failed:", err);
    return null;
  }
}

// ─── Batch Parser ─────────────────────────────────────────────────────────────

export interface RawMessage {
  text?: string;
  imageBase64?: string;
  imageMimetype?: string;
  imageCaption?: string;
  source: "whatsapp" | "instagram";
}

/**
 * Batch parse a list of messages (text or image).
 * Returns only confirmed casting calls.
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
      // Vision path
      parsed = await parseImage(msg.imageBase64, msg.imageMimetype || "image/jpeg", msg.imageCaption || "", keywords);
    } else if (msg.text) {
      // Text path
      parsed = await parseMessage(msg.text, msg.source, keywords);
    }

    if (parsed) {
      parsed.originalText = msg.text || msg.imageCaption || "[image]";
      results.push(parsed);
    }

    // Delay to respect rate limits (free tier)
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
}
