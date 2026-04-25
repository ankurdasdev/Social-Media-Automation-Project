import { query, queryOne } from "../db/index";
import type { Contact } from "@shared/api";

/**
 * Helper to safely parse strings to string array if they are valid JSON arrays.
 */
function safelyParseStringArray(val: string | null): string[] | string {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
    return val;
  } catch {
    // If it fails to parse, it means it's an old legacy string
    return val;
  }
}

/**
 * Maps a database row to a Contact object.
 */
function mapRowToContact(row: any): Contact {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name || "",
    castingName: row.casting_name || "",
    whatsapp: row.whatsapp || "",
    email: row.email || "",
    instaHandle: row.insta_handle || "",
    actingContext: row.acting_context || "",
    project: row.project || "",
    age: row.age || "",
    sheetName: row.sheet_name || "",
    status: row.status || "pending",
    automationTrigger: row.automation_trigger || false,
    rowColor: row.row_color,
    whatsappRun: row.whatsapp_run || false,
    emailRun: row.email_run || false,
    instagramRun: row.instagram_run || false,
    whatsappNeeded: row.whatsapp_run ? "Yes" : "No", 
    emailNeeded: row.email_run ? "Yes" : "No", 
    whatsappCompleted: row.whatsapp_completed || "No",
    emailCompleted: row.email_completed || "No",
    instagramDone: row.instagram_done || "No",
    instagramCompleted: row.instagram_completed || "No",
    personalizedNameWA: row.personalized_name_wa || "N",
    personalizedNameGmail: row.personalized_name_gmail || "N",
    personalizedNameIG: row.personalized_name_ig || "N",
    templateSelectionWP: safelyParseStringArray(row.template_selection_wp),
    templateSelectionGmail: safelyParseStringArray(row.template_selection_gmail),
    templateSelectionIG: safelyParseStringArray(row.template_selection_ig),
    hasCustomMessageWA: row.has_custom_message_wa || false,
    editableMessageWP: row.editable_message_wp || "",
    hasCustomMessageEmail: row.has_custom_message_email || false,
    editableMessageGmail: row.editable_message_gmail || "",
    editableGmailSubject: row.editable_gmail_subject || "",
    hasCustomMessageIG: row.has_custom_message_ig || false,
    editableMessageIG: row.editable_message_ig || "",
    specialAttachmentWA: row.special_attachment_wa || "",
    specialAttachmentGmail: row.special_attachment_gmail || "",
    specialAttachmentIG: row.special_attachment_ig || "",
    salutationWA: row.salutation_wa || "Hi",
    salutationEmail: row.salutation_email || "Hi",
    salutationIG: row.salutation_ig || "Hi",
    notes: row.notes || "",
    source: row.source || "manual",
    followups: String(row.follow_ups || 0),
    totalDatesContacts: String(row.contacted_dates?.length || 0),
    lastContactedDate: row.last_contacted || "",
    automationComment: row.automation_comment || "",
    ingestedAt: row.created_at?.toISOString(),
    visit: row.visit || "",
    unified_attachments: row.unified_attachments || [],
    drive_attachments_wa: row.drive_attachments_wa || [],
    drive_attachments_email: row.drive_attachments_email || [],
    drive_attachments_ig: row.drive_attachments_ig || [],
  } as Contact;
}

export async function getAllContacts(userId: string): Promise<Contact[]> {
  const rows = await query("SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  return rows.map(mapRowToContact);
}

export async function getContactById(userId: string, id: string): Promise<Contact | null> {
  const row = await queryOne("SELECT * FROM contacts WHERE user_id = $1 AND id = $2", [userId, id]);
  return row ? mapRowToContact(row) : null;
}

export async function createContact(userId: string, data: Partial<Contact>): Promise<Contact> {
  const sql = `
    INSERT INTO contacts (
      user_id, name, casting_name, whatsapp, email, insta_handle, acting_context, project, age,
      sheet_name, status, automation_trigger, row_color, source,
      unified_attachments, drive_attachments_wa, drive_attachments_email, drive_attachments_ig
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
  `;
  const ua = data.unified_attachments || [];
  const uaStr = JSON.stringify(ua);
  const values = [
    userId, data.name, data.castingName, data.whatsapp, data.email, data.instaHandle,
    data.actingContext, data.project || "Casting Data", data.age, data.sheetName || "",
    data.status || "pending", data.automationTrigger || false, data.rowColor, data.source || "manual",
    uaStr, uaStr, uaStr, uaStr
  ];
  const row = await queryOne(sql, values);
  return mapRowToContact(row);
}

export async function updateContact(userId: string, id: string, data: Partial<Contact>): Promise<Contact | null> {
  // Explicit camelCase → snake_case map for all Contact DB columns
  const fieldMap: Record<string, string> = {
    name: "name",
    castingName: "casting_name",
    whatsapp: "whatsapp",
    email: "email",
    instaHandle: "insta_handle",
    actingContext: "acting_context",
    visit: "visit",
    project: "project",
    age: "age",
    sheetName: "sheet_name",
    status: "status",
    automationTrigger: "automation_trigger",
    rowColor: "row_color",
    whatsappRun: "whatsapp_run",
    emailRun: "email_run",
    instagramRun: "instagram_run",
    whatsappNeeded: "whatsapp_run", // Direct mapping for UI override
    emailNeeded: "email_run", // Direct mapping for UI override
    personalizedNameWA: "personalized_name_wa",
    personalizedNameGmail: "personalized_name_gmail",
    personalizedNameIG: "personalized_name_ig",
    templateSelectionWP: "template_selection_wp",
    templateSelectionGmail: "template_selection_gmail",
    templateSelectionIG: "template_selection_ig",
    salutationWA: "salutation_wa",
    salutationEmail: "salutation_email",
    salutationIG: "salutation_ig",
    hasCustomMessageWA: "has_custom_message_wa",
    editableMessageWP: "editable_message_wp",
    hasCustomMessageEmail: "has_custom_message_email",
    editableMessageGmail: "editable_message_gmail",
    editableGmailSubject: "editable_gmail_subject",
    hasCustomMessageIG: "has_custom_message_ig",
    editableMessageIG: "editable_message_ig",
    specialAttachmentWA: "special_attachment_wa",
    specialAttachmentGmail: "special_attachment_gmail",
    specialAttachmentIG: "special_attachment_ig",
    drive_attachments_wa: "drive_attachments_wa",
    drive_attachments_email: "drive_attachments_email",
    drive_attachments_ig: "drive_attachments_ig",
    whatsappCompleted: "whatsapp_completed",
    emailCompleted: "email_completed",
    instagramDone: "instagram_done",
    instagramCompleted: "instagram_completed",
    notes: "notes",
    source: "source",
    automationComment: "automation_comment",
    lastContactedDate: "last_contacted",
    contacted_dates: "contacted_dates",
    contact_links: "contact_links",
    unified_attachments: "unified_attachments",
  };

  // Handle unified_attachments by mirroring it to all three platforms
  if (data.unified_attachments !== undefined) {
    data.drive_attachments_wa = data.unified_attachments;
    data.drive_attachments_email = data.unified_attachments;
    data.drive_attachments_ig = data.unified_attachments;
  }

  // Handle templateSelection arrays by stringifying them so they can fit in TEXT columns
  if (Array.isArray(data.templateSelectionWP)) data.templateSelectionWP = JSON.stringify(data.templateSelectionWP);
  if (Array.isArray(data.templateSelectionGmail)) data.templateSelectionGmail = JSON.stringify(data.templateSelectionGmail);
  if (Array.isArray(data.templateSelectionIG)) data.templateSelectionIG = JSON.stringify(data.templateSelectionIG);

  // Only include fields we have an explicit mapping for (ignore frontend-only fields)
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'user_id' && fieldMap[k]);
  if (fields.length === 0) return getContactById(userId, id);

  const setClause = fields.map((f, i) => {
    const col = fieldMap[f];
    // JSONB fields need explicit cast
    const isJsonb = ["drive_attachments_wa", "drive_attachments_email", "drive_attachments_ig", "unified_attachments", "contacted_dates", "contact_links"].includes(col);
    return `${col} = $${i + 3}${isJsonb ? "::jsonb" : ""}`;
  }).join(", ");

  const sql = `UPDATE contacts SET ${setClause}, updated_at = NOW() WHERE user_id = $1 AND id = $2 RETURNING *`;
  const values = [userId, id, ...fields.map(f => {
    const val = (data as any)[f];
    // Stringify JSON values for JSONB columns
    const col = fieldMap[f];
    const isJsonb = ["drive_attachments_wa", "drive_attachments_email", "drive_attachments_ig", "unified_attachments", "contacted_dates", "contact_links"].includes(col);
    return isJsonb && val !== null && val !== undefined ? JSON.stringify(val) : val;
  })];

  const row = await queryOne(sql, values);
  return row ? mapRowToContact(row) : null;
}

export async function deleteContact(userId: string, id: string): Promise<boolean> {
  const result = await query("DELETE FROM contacts WHERE user_id = $1 AND id = $2", [userId, id]);
  return true; // Simple approach
}

/**
 * Smart upsert for auto-ingested contacts.
 */
export async function upsertContact(
  userId: string,
  data: Partial<Contact>,
  source: "auto-whatsapp" | "auto-instagram"
): Promise<{ action: "created" | "updated" | "skipped"; contact: Contact }> {
  
  // Find existing by phone or email or (name+project) for THIS user
  let existingSql = "SELECT * FROM contacts WHERE user_id = $1 AND (";
  const conditions: string[] = [];
  const vals: any[] = [userId];

  if (data.whatsapp) {
    conditions.push("whatsapp = $" + (vals.length + 1));
    vals.push(data.whatsapp);
  }
  if (data.email) {
    conditions.push("email = $" + (vals.length + 1));
    vals.push(data.email);
  }
  if (data.name && data.project) {
    conditions.push("(LOWER(name) = LOWER($" + (vals.length + 1) + ") AND LOWER(project) = LOWER($" + (vals.length + 2) + "))");
    vals.push(data.name, data.project);
  }

  if (conditions.length === 0) {
    const contact = await createContact(userId, { ...data, rowColor: "yellow", source, ingestedAt: new Date().toISOString() });
    return { action: "created", contact };
  }

  existingSql += conditions.join(" OR ") + ")";
  const existing = await queryOne(existingSql, vals);

  if (existing) {
    const updates: Partial<Contact> = {};
    if (!existing.casting_name && data.castingName) updates.castingName = data.castingName;
    if (!existing.project && data.project) updates.project = data.project;
    if (!existing.age && data.age) updates.age = data.age;
    if (!existing.acting_context && data.actingContext) updates.actingContext = data.actingContext;
    if (!existing.insta_handle && data.instaHandle) updates.instaHandle = data.instaHandle;
    if (!existing.email && data.email) updates.email = data.email;
    if (!existing.whatsapp && data.whatsapp) updates.whatsapp = data.whatsapp;
    if (data.notes) updates.notes = [existing.notes, data.notes].filter(Boolean).join(" | ");

    if (Object.keys(updates).length === 0) {
      return { action: "skipped", contact: mapRowToContact(existing) };
    }

    const updated = await updateContact(userId, existing.id, updates);
    return { action: "updated", contact: updated! };
  }

  const newContact = await createContact(userId, {
    ...data,
    rowColor: "yellow",
    source,
    ingestedAt: new Date().toISOString(),
  });

  return { action: "created", contact: newContact };
}
