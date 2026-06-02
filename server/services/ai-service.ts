import OpenAI from "openai";

const SYSTEM_PROMPT = `
You are a SQL expert for a PostgreSQL database. 
Your task is to convert a natural language search query into a valid SQL SELECT statement for the 'contacts' table.

Table Schema (contacts):
- id (UUID)
- user_id (UUID)
- name (TEXT)
- casting_name (TEXT) - e.g., 'Mom Casting Agency'
- email (TEXT)
- whatsapp (TEXT) - phone numbers
- insta_handle (TEXT)
- acting_context (TEXT)
- notes (TEXT)
- status (TEXT) - values: 'pending', 'sent', 'failed', 'in progress'
- project (TEXT)
- sheet_name (TEXT)
- age (TEXT)
- whatsapp_completed (TEXT) - values: 'Yes', 'No'
- email_completed (TEXT) - values: 'Yes', 'No'
- instagram_completed (TEXT) - values: 'Yes', 'No'

Rules:
1. ALWAYS include "WHERE user_id = 'USER_ID_PLACEHOLDER'".
2. Return ONLY the SQL query, no explanations or markdown blocks.
3. Be careful with ILIKE for text searching (e.g., name ILIKE '%John%').
4. If asked about "approached on WhatsApp", it means whatsapp_completed = 'Yes'. Same for email and instagram. "Only approached on WhatsApp" means whatsapp_completed = 'Yes' AND email_completed = 'No' AND instagram_completed = 'No'.
5. If asked about "international number contacts", use: (whatsapp LIKE '+%' AND whatsapp NOT LIKE '+91%') OR (length(regexp_replace(whatsapp, '\\D', '', 'g')) > 10 AND whatsapp NOT LIKE '+91%').
6. If asked about a casting agency, search casting_name ILIKE '%AgencyName%'.

Example:
User: "Show me all contacts from Talent sheet who haven't been emailed yet"
SQL: SELECT * FROM contacts WHERE user_id = 'USER_ID_PLACEHOLDER' AND sheet_name ILIKE '%Talent%' AND email_completed = 'No';
`;

export async function generateSearchSQL(prompt: string, userId: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Please add it to your environment variables.");
  }

  const groq = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });

  let sql = completion.choices[0].message?.content || "";
  
  // Strip markdown code blocks if present
  sql = sql.replace(/```sql/gi, "").replace(/```/g, "").trim();
  
  // Basic sanitization: only allow SELECT
  if (!sql.toUpperCase().startsWith("SELECT")) {
    throw new Error("AI generated an invalid query.");
  }

  // Inject the real user ID
  sql = sql.replace(/USER_ID_PLACEHOLDER/g, userId);
  
  // Security: Remove any semicolons to prevent multi-statements
  sql = sql.replace(/;/g, "");

  return sql;
}

export async function generateOpenAIResponse(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set.");
  }

  const groq = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  return completion.choices[0].message?.content?.trim() || "No response generated.";
}
