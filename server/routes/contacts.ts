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
import type { ContactsResponse, ContactResponse, ErrorResponse, IngestionStatusResponse } from "@shared/api";
import { generateOpenAIResponse } from "../services/ai-service";

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
    res.status(201).json({ contacts: created, total: created.length });
  } catch (err: any) {
    console.error("[handleBulkCreateContacts] Error:", err);
    res.status(500).json({ error: "Bulk creation failed: " + err.message });
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
        COUNT(*) FILTER (WHERE email_completed = 'Failed' OR whatsapp_completed = 'Failed' OR instagram_completed = 'Failed') as failed
      FROM contacts
      WHERE user_id = $1
      GROUP BY sheet_name
      ORDER BY total DESC
      LIMIT 10
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
        totalSuccess: parseInt(d.total_success || "0"),
        totalFailed: parseInt(d.total_failed || "0")
      })),
      cohorts: cohorts.map(c => ({
        sheet: c.sheet,
        total: parseInt(c.total || "0"),
        success: parseInt(c.success || "0"),
        failed: parseInt(c.failed || "0")
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
