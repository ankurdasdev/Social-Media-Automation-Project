import { query, queryOne } from "../db/index";
import type { Contact } from "@shared/api";

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
    whatsappNeeded: "", // Legacy field for UI compatibility
    emailNeeded: "", // Legacy field for UI compatibility
    whatsappCompleted: row.whatsapp_run ? "Yes" : "No",
    emailCompleted: row.email_run ? "Yes" : "No",
    instagramDone: row.instagram_run ? "Yes" : "No",
    personalizedNameWA: "",
    personalizedNameGmail: "",
    personalizedNameIG: "",
    templateSelectionWP: row.template_selection_wp || "",
    templateSelectionGmail: row.template_selection_gmail || "",
    templateSelectionIG: row.template_selection_ig || "",
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
    visit: "",
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
      sheet_name, status, automation_trigger, row_color, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;
  const values = [
    userId, data.name, data.castingName, data.whatsapp, data.email, data.instaHandle,
    data.actingContext, data.project || "Casting Data", data.age, data.sheetName || "",
    data.status || "pending", data.automationTrigger || false, data.rowColor, data.source || "manual"
  ];
  const row = await queryOne(sql, values);
  return mapRowToContact(row);
}

export async function updateContact(userId: string, id: string, data: Partial<Contact>): Promise<Contact | null> {
  // Build dynamic update query
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'user_id');
  if (fields.length === 0) return getContactById(userId, id);

  const setClause = fields.map((f, i) => {
    // map camelCase to snake_case if necessary
    const snake = f.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return `${snake} = $${i + 3}`;
  }).join(", ");

  const sql = `UPDATE contacts SET ${setClause}, updated_at = NOW() WHERE user_id = $1 AND id = $2 RETURNING *`;
  const values = [userId, id, ...fields.map(f => (data as any)[f])];
  
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
