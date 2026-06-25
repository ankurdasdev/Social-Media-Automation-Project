/**
 * Contacts API Routes
 *
 * GET    /api/contacts                  - list all contacts (with filters)
 * POST   /api/contacts                  - create a contact manually
 * PUT    /api/contacts/:id              - update a contact
 * DELETE /api/contacts/:id              - delete a contact
 * POST   /api/ingestion/trigger         - manually trigger the ingestion job
 * GET    /api/ingestion/status          - last run status + next run time
 */

import { RequestHandler } from "express";
import {
  getAllContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../store/contacts-store";
import { runIngestionJob, getIngestionState } from "../jobs/ingestion-job";
import { generateSearchSQL } from "../services/ai-service";
import { query, queryOne } from "../db/index";
import type { ContactsResponse, ContactResponse, ErrorResponse, IngestionStatusResponse, Contact } from "@shared/api";
import { generateOpenAIResponse, generateChatResponse } from "../services/ai-service";
import { parseCastingImageForMultipleContacts } from "../services/ai-parser";

// ─── GET /api/contacts ────────────────────────────────────────────────────────

export const handleGetContacts: RequestHandler = async (req, res) => {
  const userId = (req.query.userId as string) || process.env.DEFAULT_USER_ID;
  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID in .env or pass it as a query param." });
    return;
  }

  try {
    let contacts = await getAllContacts(userId);

    const { search, status, project, source } = req.query as Record<string, string>;

    if (search) {
      const q = search.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.whatsapp || "").includes(q) ||
          (c.instaHandle || "").toLowerCase().includes(q) ||
          (c.castingName || "").toLowerCase().includes(q)
      );
    }

    if (status && status !== "all") {
      contacts = contacts.filter((c) => c.status === status);
    }

    if (project && project !== "all") {
      contacts = contacts.filter((c) => c.project === project);
    }

    if (source && source !== "all") {
      contacts = contacts.filter((c) => c.source === source);
    }

    const response: ContactsResponse = { contacts, total: contacts.length };
    res.json(response);
  } catch (err: any) {
    console.error("[handleGetContacts] Error:", err);
    res.status(500).json({ error: "Failed to fetch contacts: " + err.message });
  }
};

// ─── POST /api/contacts ───────────────────────────────────────────────────────

export const handleCreateContact: RequestHandler = async (req, res) => {
  const userId = req.body.userId || process.env.DEFAULT_USER_ID; 
  const { name } = req.body;
  
  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID in .env or pass it in the body." });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const contact = await createContact(userId, req.body);
  const response: ContactResponse = { contact };
  res.status(201).json(response);
};

// ─── POST /api/contacts/bulk ──────────────────────────────────────────────────

export const handleBulkCreateContacts: RequestHandler = async (req, res) => {
  const userId = req.body.userId || process.env.DEFAULT_USER_ID;
  const { contacts } = req.body;

  if (!userId) {
    res.status(400).json({ error: "userId is required." });
    return;
  }
  if (!Array.isArray(contacts)) {
    res.status(400).json({ error: "contacts must be an array of objects." });
    return;
  }

  try {
    const created: any[] = [];
    for (const c of contacts) {
      if (!c.name) continue;
      const contact = await createContact(userId, c);
      created.push(contact);
    }
    res.status(201).json({ contacts: created });
  } catch (err: any) {
    console.error("[handleBulkCreateContacts] Error:", err);
    res.status(500).json({ error: "Failed to bulk create contacts: " + err.message });
  }
};

// ─── POST /api/contacts/parse-image ───────────────────────────────────────────

export const handleParseContactImage: RequestHandler = async (req, res) => {
  const userId = req.body.userId || process.env.DEFAULT_USER_ID;
  const { base64Image, mimeType = "image/jpeg" } = req.body;

  if (!userId) {
    res.status(400).json({ error: "userId is required." });
    return;
  }
  if (!base64Image) {
    res.status(400).json({ error: "base64Image is required." });
    return;
  }

  try {
    // Fetch user's AI keywords and gender for smart filtering
    const userRow = await queryOne<{ ai_keywords: string[]; gender: string }>(
      "SELECT ai_keywords, gender FROM users WHERE id = $1",
      [userId]
    );
    const userKeywords: string[] = userRow?.ai_keywords || [];
    const userGender: string = userRow?.gender || "";

    const parsedContacts = await parseCastingImageForMultipleContacts(
      base64Image,
      mimeType,
      userKeywords,
      userGender
    );
    
    if (!parsedContacts || parsedContacts.length === 0) {
      res.status(200).json({ contacts: [], message: "No relevant casting calls found in the image." });
      return;
    }

    // Format fields and prepare for bulk insert
    const contactsToInsert = parsedContacts.map((c) => {
      let formattedWa = (c.whatsapp || "").replace(/[^0-9+]/g, ""); // Strip spaces/dashes
      
      // If it doesn't start with +91 or 91, prepend 91 (if not empty)
      if (formattedWa) {
        if (!formattedWa.startsWith("+91") && !formattedWa.startsWith("91")) {
          formattedWa = formattedWa.startsWith("+") ? "+91" + formattedWa.substring(1) : "91" + formattedWa;
        }
      }

      return {
        name: c.name || "Unknown",
        castingName: c.castingName || "",
        whatsapp: formattedWa,
        email: c.email || "",
        instaHandle: c.instaHandle || "",
        actingContext: c.actingContext || "",
        project: c.project || "",
        age: c.age || "",
        source: "manual" as "manual" | "auto-whatsapp" | "auto-instagram", 
        status: "pending",
        whatsappNeeded: formattedWa ? "Yes" : "No",
        emailNeeded: c.email ? "Yes" : "No",
      };
    });

    const created = [];
    for (const data of contactsToInsert) {
      created.push(await createContact(userId, data));
    }

    res.status(201).json({ contacts: created });
  } catch (err: any) {
    console.error("[handleParseContactImage] Error:", err);
    res.status(500).json({ error: "Failed to parse image and create contacts: " + err.message });
  }
};

// ─── PUT /api/contacts/:id ────────────────────────────────────────────────────

export const handleUpdateContact: RequestHandler = async (req, res) => {
  const userId = (req.body.userId || req.query.userId || process.env.DEFAULT_USER_ID) as string;
  const { id } = req.params;

  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID or pass it." });
    return;
  }

  const updated = await updateContact(userId, id as string, req.body);
  if (!updated) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  const response: ContactResponse = { contact: updated };
  res.json(response);
};

// ─── PUT /api/contacts/bulk ───────────────────────────────────────────────────

export const handleBulkContactsAction: RequestHandler = async (req, res) => {
  const userId = (req.query.userId || req.body.userId || process.env.DEFAULT_USER_ID) as string;
  const { ids, action, payload } = req.body;

  if (!userId || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "userId and an array of ids are required." });
    return;
  }

  try {
    for (const id of ids) {
      if (action === "color") {
        await updateContact(userId, id, { rowColor: payload });
      } else if (action === "move") {
        await updateContact(userId, id, { sheetName: payload });
      }
      // If action is something else, we could handle it here.
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("[handleBulkContactsAction] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/contacts/bulk/clear ────────────────────────────────────────────

export const handleBulkClearContacts: RequestHandler = async (req, res) => {
  const userId = (req.query.userId || req.body.userId || process.env.DEFAULT_USER_ID) as string;
  const { ids, fields } = req.body;

  if (!userId || !Array.isArray(ids) || ids.length === 0 || !Array.isArray(fields)) {
    res.status(400).json({ error: "userId, array of ids, and array of fields are required." });
    return;
  }

  try {
    const updatePayload: Partial<Contact> = {};
    for (const f of fields) {
      if (["templateSelectionWP", "templateSelectionGmail", "templateSelectionIG", "drive_attachments_wa", "drive_attachments_email", "drive_attachments_ig"].includes(f)) {
         (updatePayload as any)[f] = [];
      } else if (f === "cellColors") {
         (updatePayload as any)[f] = {};
      } else if (f === "rowColor") {
         (updatePayload as any)[f] = "transparent";
      } else if (["hasCustomMessageWA", "hasCustomMessageEmail", "hasCustomMessageIG"].includes(f)) {
         (updatePayload as any)[f] = false;
      } else {
         (updatePayload as any)[f] = "";
      }
    }
    
    for (const id of ids) {
      await updateContact(userId, id, updatePayload);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("[handleBulkClearContacts] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/contacts/bulk ────────────────────────────────────────────────

export const handleBulkDeleteContacts: RequestHandler = async (req, res) => {
  const userId = ((req.query.userId as string) || (req.body.userId as string) || process.env.DEFAULT_USER_ID) as string;
  const { ids } = req.body;

  if (!userId || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "userId and an array of ids are required." });
    return;
  }

  try {
    for (const id of ids) {
      await deleteContact(userId, id);
    }
    res.status(204).send();
  } catch (err: any) {
    console.error("[handleBulkDeleteContacts] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/contacts/:id ─────────────────────────────────────────────────

export const handleDeleteContact: RequestHandler = async (req, res) => {
  const userId = ((req.query.userId as string) || (req.body.userId as string) || process.env.DEFAULT_USER_ID) as string;
  const { id } = req.params;

  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID or pass it." });
    return;
  }

  const deleted = await deleteContact(userId, id as string);
  if (!deleted) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.status(204).send();
};

// ─── POST /api/ingestion/trigger ──────────────────────────────────────────────

export const handleTriggerIngestion: RequestHandler = async (req, res) => {
  // Global trigger for now, though it will process all users
  const { isRunning } = getIngestionState();
  if (isRunning) {
    res.status(409).json({ error: "Ingestion job is already running" });
    return;
  }

  res.json({ message: "Ingestion job started", startedAt: new Date().toISOString() });

  runIngestionJob().catch((err) =>
    console.error("[ingestion] Background run error:", err)
  );
};

// ─── GET /api/ingestion/status ────────────────────────────────────────────────

export const handleIngestionStatus: RequestHandler = (_req, res) => {
  const { isRunning, lastRun } = getIngestionState();

  const now = new Date();
  const nextRun = new Date();
  nextRun.setUTCHours(18, 30, 0, 0); // midnight IST
  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  const response: IngestionStatusResponse = {
    isRunning,
    lastRun,
    nextRunAt: nextRun.toISOString(),
  };

  res.json(response);
};

// ─── POST /api/contacts/ai-search ───────────────────────────────────────────

export const handleAIContactSearch: RequestHandler = async (req, res) => {
  const { userId, prompt } = req.body;
  if (!userId || !prompt) {
    return res.status(400).json({ error: "userId and prompt are required" });
  }

  try {
    const sql = await generateSearchSQL(prompt, userId);
    console.log(`[AI Search] Generated SQL: ${sql}`);
    
    const contacts = await query<any>(sql);
    
    // Normalize field names (database uses snake_case, shared/api uses camelCase)
    const normalized = contacts.map((c: any) => ({
      ...c,
      whatsappRun: c.whatsapp_run,
      emailRun: c.email_run,
      instagramRun: c.instagram_run,
      personalizedNameWA: c.personalized_name_wa,
      personalizedNameGmail: c.personalized_name_gmail,
      personalizedNameIG: c.personalized_name_ig,
      templateSelectionWP: c.template_selection_wp,
      templateSelectionGmail: c.template_selection_gmail,
      templateSelectionIG: c.template_selection_ig,
      hasCustomMessageWA: c.has_custom_message_wa,
      editableMessageWP: c.editable_message_wp,
      hasCustomMessageEmail: c.has_custom_message_email,
      editableMessageGmail: c.editable_message_gmail,
      editableGmailSubject: c.editable_gmail_subject,
      hasCustomMessageIG: c.has_custom_message_ig,
      editableMessageIG: c.editable_message_ig,
      whatsappCompleted: c.whatsapp_completed,
      emailCompleted: c.email_completed,
      instagramCompleted: c.instagram_completed,
      automationComment: c.automation_comment,
      sheetName: c.sheet_name,
      lastContactedDate: c.last_contacted,
      followups: c.follow_ups,
      castingName: c.casting_name,
      instaHandle: c.insta_handle,
      rowColor: c.row_color,
    }));

    res.json({ contacts: normalized, total: normalized.length });
  } catch (err: any) {
    console.error("[AI Search] Error:", err);
    res.status(500).json({ error: "Failed to process AI search: " + err.message });
  }
};

// ─── GET /api/analytics/stats ───────────────────────────────────────────────

export const handleGetAnalyticsStats: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string || process.env.DEFAULT_USER_ID;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const totalRes = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1", [userId]);
    const successRes = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND (whatsapp_completed = 'Yes' OR email_completed = 'Yes' OR instagram_completed = 'Yes')", [userId]);
    const failedRes = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND (whatsapp_completed = 'Failed' OR email_completed = 'Failed' OR instagram_completed = 'Failed') AND whatsapp_completed != 'Yes' AND email_completed != 'Yes' AND instagram_completed != 'Yes'", [userId]);
    
    const waSent = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND whatsapp_completed = 'Yes'", [userId]);
    const emailSent = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND email_completed = 'Yes'", [userId]);
    const igSent = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND instagram_completed = 'Yes'", [userId]);

    const waFailed = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND whatsapp_completed = 'Failed'", [userId]);
    const emailFailed = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND email_completed = 'Failed'", [userId]);
    const igFailed = await queryOne<{ count: string }>("SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND instagram_completed = 'Failed'", [userId]);

    const recent = await query<any>(
      "SELECT id, name, project, updated_at as date FROM contacts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5",
      [userId]
    );

    // Daily stats for the last 14 days (Heatmap + BarChart)
    const dailyStats = await query<any>(`
      SELECT 
        TO_CHAR(updated_at, 'Mon DD') as date,
        updated_at::date as real_date,
        COUNT(*) FILTER (WHERE email_completed = 'Yes') as email,
        COUNT(*) FILTER (WHERE whatsapp_completed = 'Yes') as whatsapp,
        COUNT(*) FILTER (WHERE instagram_completed = 'Yes') as instagram,
        COUNT(*) FILTER (WHERE email_completed = 'Failed') as email_failed,
        COUNT(*) FILTER (WHERE whatsapp_completed = 'Failed') as wa_failed,
        COUNT(*) FILTER (WHERE instagram_completed = 'Failed') as ig_failed,
        COUNT(*) FILTER (WHERE email_completed = 'Yes' OR whatsapp_completed = 'Yes' OR instagram_completed = 'Yes') as total_success,
        COUNT(*) FILTER (WHERE email_completed = 'Failed' OR whatsapp_completed = 'Failed' OR instagram_completed = 'Failed') as total_failed
      FROM contacts 
      WHERE user_id = $1 AND updated_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(updated_at, 'Mon DD'), updated_at::date
      ORDER BY updated_at::date ASC
    `, [userId]);

    // Cohort by Sheet Name
    const cohorts = await query<any>(`
      SELECT 
        COALESCE(sheet_name, 'Unknown') as sheet,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE email_completed = 'Yes' OR whatsapp_completed = 'Yes' OR instagram_completed = 'Yes') as success,
        COUNT(*) FILTER (WHERE email_completed = 'Failed' OR whatsapp_completed = 'Failed' OR instagram_completed = 'Failed') as failed,
        COUNT(*) FILTER (WHERE whatsapp_completed = 'Yes') as wa_success,
        COUNT(*) FILTER (WHERE whatsapp_completed = 'Failed') as wa_failed,
        COUNT(*) FILTER (WHERE email_completed = 'Yes') as email_success,
        COUNT(*) FILTER (WHERE email_completed = 'Failed') as email_failed,
        COUNT(*) FILTER (WHERE instagram_completed = 'Yes') as ig_success,
        COUNT(*) FILTER (WHERE instagram_completed = 'Failed') as ig_failed
      FROM contacts
      WHERE user_id = $1
      GROUP BY sheet_name
      ORDER BY total DESC
      LIMIT 10
    `, [userId]);

    // Fetch recent failures across all platforms
    const recentFailures = await query<any>(`
      SELECT id, name, project, whatsapp_completed, email_completed, instagram_completed, updated_at as date 
      FROM contacts 
      WHERE user_id = $1 AND (whatsapp_completed = 'Failed' OR email_completed = 'Failed' OR instagram_completed = 'Failed') 
      ORDER BY updated_at DESC LIMIT 50
    `, [userId]);

    // Funnel Data
    const funnel = [
      { step: "Total Uploaded", value: parseInt(totalRes?.count || "0") },
      { step: "Attempted", value: parseInt(successRes?.count || "0") + parseInt(failedRes?.count || "0") },
      { step: "Successfully Reached", value: parseInt(successRes?.count || "0") }
    ];

    res.json({
      total: parseInt(totalRes?.count || "0"),
      success: parseInt(successRes?.count || "0"),
      failed: parseInt(failedRes?.count || "0"),
      waSent: parseInt(waSent?.count || "0"),
      emailSent: parseInt(emailSent?.count || "0"),
      igSent: parseInt(igSent?.count || "0"),
      waFailed: parseInt(waFailed?.count || "0"),
      emailFailed: parseInt(emailFailed?.count || "0"),
      igFailed: parseInt(igFailed?.count || "0"),
      recent: recent.map(r => ({
        id: r.id,
        name: r.name || "Unknown",
        project: r.project || "General",
        date: r.date ? new Date(r.date).toLocaleString() : "Recently"
      })),
      daily: dailyStats.map(d => ({
        date: d.date,
        realDate: d.real_date,
        email: parseInt(d.email || "0"),
        whatsapp: parseInt(d.whatsapp || "0"),
        instagram: parseInt(d.instagram || "0"),
        emailFailed: parseInt(d.email_failed || "0"),
        waFailed: parseInt(d.wa_failed || "0"),
        igFailed: parseInt(d.ig_failed || "0"),
        totalSuccess: parseInt(d.total_success || "0"),
        totalFailed: parseInt(d.total_failed || "0")
      })),
      cohorts: cohorts.map(c => ({
        sheet: c.sheet,
        total: parseInt(c.total || "0"),
        success: parseInt(c.success || "0"),
        failed: parseInt(c.failed || "0"),
        waSuccess: parseInt(c.wa_success || "0"),
        waFailed: parseInt(c.wa_failed || "0"),
        emailSuccess: parseInt(c.email_success || "0"),
        emailFailed: parseInt(c.email_failed || "0"),
        igSuccess: parseInt(c.ig_success || "0"),
        igFailed: parseInt(c.ig_failed || "0")
      })),
      recentFailures: recentFailures.map(r => ({
        id: r.id,
        name: r.name || "Unknown",
        project: r.project || "General",
        whatsapp: r.whatsapp_completed,
        email: r.email_completed,
        instagram: r.instagram_completed,
        date: r.date ? new Date(r.date).toLocaleString() : "Recently"
      })),
      funnel
    });
  } catch (err: any) {
    console.error("[Analytics Stats] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/analytics/diagnose-failures ──────────────────────────────────

export const handleAIDiagnoseFailures: RequestHandler = async (req, res) => {
  const userId = req.body.userId || process.env.DEFAULT_USER_ID;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    // Fetch recent failure reasons
    const failures = await query<any>(`
      SELECT automation_comment, whatsapp_completed, email_completed, instagram_completed 
      FROM contacts 
      WHERE user_id = $1 AND (whatsapp_completed = 'Failed' OR email_completed = 'Failed' OR instagram_completed = 'Failed')
      AND automation_comment IS NOT NULL AND automation_comment != ''
      LIMIT 50
    `, [userId]);

    if (failures.length === 0) {
      return res.json({ diagnosis: "No recent failure logs found with detailed error comments. Ensure your automations are logging errors to the 'automationComment' field." });
    }

    const failureLog = failures.map(f => {
      const platform = f.whatsapp_completed === 'Failed' ? 'WhatsApp' : f.email_completed === 'Failed' ? 'Email' : 'Instagram';
      return `[${platform}] Error: ${f.automation_comment}`;
    }).join("\\n");

    const prompt = `You are an expert technical support AI for an outreach automation platform. 
Here are the recent failure logs from the user's outreach attempts:
${failureLog}

Please provide a concise, bulleted diagnosis summarizing the core reasons for these failures and recommend exactly what the user should fix. Keep it under 150 words.`;

    const diagnosis = await generateOpenAIResponse(prompt);
    res.json({ diagnosis });
  } catch (err: any) {
    console.error("[AI Diagnose] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/analytics/chat ───────────────────────────────────────────────

export const handleAnalyticsChat: RequestHandler = async (req, res) => {
  const userId = req.body.userId || process.env.DEFAULT_USER_ID;
  const { messages } = req.body;
  
  if (!userId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "userId and messages array required" });
  }

  try {
    // 1. Fetch complete contacts (limit 150 to manage token context size while giving full table data)
    const rawData = await query<any>(`
      SELECT *
      FROM contacts 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 150
    `, [userId]);

    // 2. Fetch recent logs
    const rawLogs = await query<any>(`
      SELECT action, status, details, created_at
      FROM user_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 100
    `, [userId]);

    // 3. Fetch metrics
    const stats = await queryOne<{ total: string, failed: string, success: string }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE email_completed = 'Failed' OR whatsapp_completed = 'Failed' OR instagram_completed = 'Failed') as failed,
        COUNT(*) FILTER (WHERE email_completed = 'Yes' OR whatsapp_completed = 'Yes' OR instagram_completed = 'Yes') as success
      FROM contacts WHERE user_id = $1
    `, [userId]);

    // 4. Construct Full Context
    const contextData = {
      systemMetrics: {
        totalContacts: parseInt(stats?.total || "0"),
        totalFailed: parseInt(stats?.failed || "0"),
        totalSuccess: parseInt(stats?.success || "0")
      },
      recentContacts: rawData,
      recentLogs: rawLogs
    };

    const systemPrompt = `You are a highly capable Data Analyst AI for an outreach automation platform.
Your goal is to answer the user's questions about their analytics, conversion rates, and automation failures.
You have access to the complete database context below, including all table details (contacts table and user logs).
Analyze the provided JSON data to answer the user's queries accurately. You can refer to names or specific fields if they help answer the user's question, but never expose sensitive app-level data like tokens or passwords if they inadvertently appear in logs.
Keep your answers concise, formatted in markdown, and highly actionable.

DATABASE CONTEXT:
${JSON.stringify(contextData)}
`;

    // Add system prompt to the beginning
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const responseText = await generateChatResponse(fullMessages);
    res.json({ response: responseText });
  } catch (err: any) {
    console.error("[AI Chat] Error:", err);
    res.status(500).json({ error: err.message });
  }
};
