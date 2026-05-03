import { RequestHandler } from "express";
import OpenAI from "openai";

// Lazy-load client to prevent crash if key is missing
let _ai: OpenAI | null = null;
function getAI() {
  if (!_ai && process.env.GROQ_API_KEY) {
    _ai = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
  }
  return _ai;
}

/**
 * POST /api/ai/improve-message
 * Body: { prompt, currentText?, context? }
 */
export const handleImproveMessage: RequestHandler = async (req, res) => {
  const { prompt, currentText, context } = req.body;

  if (!prompt && !currentText) {
    return res.status(400).json({ error: "Prompt or current text is required" });
  }

  const groq = getAI();
  if (!groq) {
    return res.status(503).json({ error: "AI service is not configured. Please set GROQ_API_KEY." });
  }

  try {
    const systemPrompt = `You are an expert Casting Outreach Assistant. 
Your goal is to help talent or agents write highly professional, concise, and effective outreach messages for casting calls.
The user will provide either a prompt of what they want to say, or an existing message to improve.
Return ONLY the final message content. No conversational filler, no quotes, no 'Here is your message'.
Preserve any variables like {{name}}, {{project}}, {{age}} if they are present.`;

    const userPrompt = prompt 
      ? `PROMPT: ${prompt}\n\nCURRENT TEXT (if any): ${currentText || ""}\n\nCONTEXT: ${JSON.stringify(context || {})}`
      : `IMPROVE THIS TEXT: ${currentText}\n\nCONTEXT: ${JSON.stringify(context || {})}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const result = completion.choices[0]?.message?.content?.trim() || "";
    res.json({ result });
  } catch (err: any) {
    console.error("[ai-improve] Error:", err.message);
    res.status(500).json({ error: "Failed to generate message" });
  }
};
