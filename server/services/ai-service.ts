import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const SYSTEM_PROMPT = `
You are a SQL expert for a PostgreSQL database. 
Your task is to convert a natural language search query into a valid SQL SELECT statement for the 'contacts' table.

Table Schema:
- id (UUID)
- user_id (UUID)
- name (TEXT)
- email (TEXT)
- whatsapp (TEXT)
- insta_handle (TEXT)
- status (TEXT) - values: 'pending', 'sent', 'failed', 'in progress'
- project (TEXT)
- sheet_name (TEXT)
- whatsapp_completed (TEXT) - values: 'Yes', 'No'
- email_completed (TEXT) - values: 'Yes', 'No'
- instagram_completed (TEXT) - values: 'Yes', 'No'
- notes (TEXT)

Rules:
1. ALWAYS include "WHERE user_id = 'USER_ID_PLACEHOLDER'".
2. Return ONLY the SQL query, no explanations or markdown blocks.
3. Be careful with ILIKE for text searching.
4. Support queries about specific platforms (whatsapp, email/gmail, instagram).
5. If the user asks for "talent", "director", etc., search in name, notes or acting_context.

Example:
User: "Show me all contacts from Talent sheet who haven't been emailed yet"
SQL: SELECT * FROM contacts WHERE user_id = 'USER_ID_PLACEHOLDER' AND sheet_name ILIKE '%Talent%' AND email_completed = 'No';
`;

export async function generateSearchSQL(prompt: string, userId: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });

  let sql = completion.choices[0].message?.content || "";
  
  // Basic sanitization: only allow SELECT
  if (!sql.trim().toUpperCase().startsWith("SELECT")) {
    throw new Error("AI generated an invalid query.");
  }

  // Inject the real user ID
  sql = sql.replace(/USER_ID_PLACEHOLDER/g, userId);
  
  // Security: Remove any semicolons to prevent multi-statements
  sql = sql.replace(/;/g, "");

  return sql;
}
