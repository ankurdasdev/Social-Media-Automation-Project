import { getGmailClient, getDriveClient } from "../routes/google-auth";
import { sendMessage as sendWA, sendMedia as sendWAMedia } from "./whatsapp-client";
import { sendDirectMessage as sendIG } from "./instagram-client";
import { query, queryOne } from "../db/index";
import { getContactById } from "../store/contacts-store";
import { DriveFile, Contact } from "@shared/api";
import path from "path";

/**
 * Outreach Orchestrator
 * Handles sending messages across different channels with support for Drive attachments.
 */

export interface OutreachRequest extends Partial<Contact> {
  contactId: string;
  userId: string;
  channel: "whatsapp" | "email" | "instagram";
}

function injectVariables(content: string, contact: Contact, channel: "whatsapp" | "email" | "instagram"): string {
  if (!content) return "";
  let result = content;
  
  // Resolve Personalized Name based on N/C/NA picklist
  let pName = "Talent";
  const picklist = 
    channel === "whatsapp" ? contact.personalizedNameWA :
    channel === "email" ? contact.personalizedNameGmail :
    contact.personalizedNameIG;

  if (picklist === "N") pName = contact.name || "Talent";
  else if (picklist === "C") pName = contact.castingName || "the casting";
  else if (picklist === "NA") pName = "";

  const variables = [
    { name: "name", value: pName },
    { name: "castingName", value: contact.castingName || "the casting" },
    { name: "age", value: contact.age || "the age bracket" },
    { name: "project", value: contact.project || "Project" },
    { name: "actingContext", value: contact.actingContext || "the role" },
    { name: "whatsapp", value: contact.whatsapp || "" },
    { name: "email", value: contact.email || "" },
    { name: "instaHandle", value: contact.instaHandle || "" },
  ];

  variables.forEach((v) => {
    const regex = new RegExp(`{{${v.name}}}`, "g");
    result = result.replace(regex, v.value);
  });

  return result;
}

export async function sendOutreach(req: OutreachRequest) {
  const { contactId, userId, channel } = req;

  // 1. Fetch full contact properly mapped
  const contact = await getContactById(userId, contactId);
  if (!contact) throw new Error("Contact not found");

  // Merge request overrides into contact data for this run
  const data = { ...contact, ...req };

  let result: any;

  try {
    if (channel === "whatsapp") {
      result = await handleWhatsAppOutreach(userId, data);
    } else if (channel === "email") {
      result = await handleEmailOutreach(userId, data);
    } else if (channel === "instagram") {
      result = await handleInstagramOutreach(userId, data);
    }

    // 2. Update contact status and tracking
    const now = new Date().toISOString();
    const contactedDates = Array.isArray(contact.contacted_dates) ? contact.contacted_dates : [];

    await query(
      `UPDATE contacts SET 
        status = 'sent',
        last_contacted = $1,
        contacted_dates = $2,
        whatsapp_completed = CASE WHEN $3 = 'whatsapp' THEN 'Yes' ELSE whatsapp_completed END,
        email_completed = CASE WHEN $3 = 'email' THEN 'Yes' ELSE email_completed END,
        instagram_completed = CASE WHEN $3 = 'instagram' THEN 'Yes' ELSE instagram_completed END,
        instagram_done = CASE WHEN $3 = 'instagram' THEN 'Yes' ELSE instagram_done END,
        whatsapp_run = CASE WHEN $3 = 'whatsapp' THEN TRUE ELSE whatsapp_run END,
        email_run = CASE WHEN $3 = 'email' THEN TRUE ELSE email_run END,
        instagram_run = CASE WHEN $3 = 'instagram' THEN TRUE ELSE instagram_run END,
        follow_ups = COALESCE(follow_ups, 0) + 1,
        updated_at = NOW()
       WHERE id = $4 AND user_id = $5`,
      [now, JSON.stringify([...contactedDates, now]), channel, contactId, userId]
    );

    return { success: true, result };
  } catch (err: any) {
    console.error(`Outreach failed for contact ${contactId} via ${channel}:`, err);
    await query(
      `UPDATE contacts SET 
         status = CASE WHEN status = 'sent' THEN 'sent' ELSE 'failed' END, 
         automation_comment = $2, 
         whatsapp_completed = CASE WHEN $3 = 'whatsapp' THEN 'Failed' ELSE whatsapp_completed END,
         email_completed = CASE WHEN $3 = 'email' THEN 'Failed' ELSE email_completed END,
         instagram_completed = CASE WHEN $3 = 'instagram' THEN 'Failed' ELSE instagram_completed END,
         updated_at = NOW() 
       WHERE id = $1 AND user_id = $4`,
      [contactId, `[${channel.toUpperCase()}]: ${err.message}`, channel, userId]
    );
    throw err;
  }
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

async function handleWhatsAppOutreach(userId: string, contact: Contact) {
  const instance = await queryOne<{ instance_name: string }>(
    "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1 ",
    [userId]
  );
  if (!instance) throw new Error("WhatsApp not connected — please connect in Settings first");

  const rawNumber = (contact.whatsapp || "").replace(/\D/g, "");
  if (!rawNumber) throw new Error("No valid WhatsApp number found on this contact");
  const jid = rawNumber.includes("@") ? rawNumber : `${rawNumber}@s.whatsapp.net`;

  // 1. Custom Message Override (Sent First if present)
  if (contact.hasCustomMessageWA && contact.editableMessageWP) {
      await sendWA(instance.instance_name, jid, contact.editableMessageWP);
  }

  // 2. Resolve Templates in Order
  const templateIds = Array.isArray(contact.templateSelectionWP) ? contact.templateSelectionWP : [];
  const attachments: DriveFile[] = contact.unified_attachments || [];

  for (const tId of templateIds) {
    const template = await queryOne<any>(
      "SELECT content, is_attachment, drive_file_id, drive_file_name FROM templates WHERE id = $1 AND user_id = $2",
      [tId, userId]
    );
    if (!template) continue;

    if (template.is_attachment && template.drive_file_id) {
       attachments.push({ id: template.drive_file_id, name: template.drive_file_name, mimeType: "", downloadUrl: "" });
    } else if (template.content) {
       const message = injectVariables(template.content, contact, "whatsapp");
       await sendWA(instance.instance_name, jid, message);
    }
  }

  // 3. Send Attachments
  if (attachments.length > 0) {
    const drive = await getDriveClient(userId);
    for (const file of attachments) {
      try {
        const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
        const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
        const meta = await drive.files.get({ fileId: file.id, fields: "mimeType" });
        const mimeType = meta.data.mimeType || "application/octet-stream";
        const dataUrl = `data:${mimeType};base64,${base64}`;
        await sendWAMedia(instance.instance_name, jid, dataUrl, file.name, file.name);
      } catch (attachErr: any) {
        console.warn(`[outreach] WA attachment failed for ${file.name}:`, attachErr.message);
      }
    }
  }

  return { success: true };
}

// ─── Email via Gmail API ──────────────────────────────────────────────────────

/**
 * Build a base64url-encoded RFC2822 MIME message for the Gmail API.
 * Supports plain text body + optional binary attachments.
 */
async function buildMimeMessage(opts: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: { filename: string; content: Buffer; mimeType: string }[];
}): Promise<string> {
  const boundary = `boundary_casthub_${Date.now()}`;
  const lines: string[] = [];

  const isMultipart = opts.attachments && opts.attachments.length > 0;

  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  lines.push(`Subject: ${opts.subject}`);
  lines.push(`MIME-Version: 1.0`);

  if (isMultipart) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push(``);
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: text/plain; charset="UTF-8"`);
    lines.push(`Content-Transfer-Encoding: quoted-printable`);
    lines.push(``);
    lines.push(opts.body);

    for (const att of opts.attachments!) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push(``);
      // Split base64 into 76-char lines per RFC 2822
      const b64 = att.content.toString("base64");
      for (let i = 0; i < b64.length; i += 76) {
        lines.push(b64.slice(i, i + 76));
      }
    }

    lines.push(`--${boundary}--`);
  } else {
    lines.push(`Content-Type: text/plain; charset="UTF-8"`);
    lines.push(``);
    lines.push(opts.body);
  }

  const raw = lines.join("\r\n");
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function handleEmailOutreach(userId: string, contact: Contact) {
  let gmail: any;
  try {
    gmail = await getGmailClient(userId);
  } catch (err: any) {
    throw new Error("Gmail not connected — please connect your Google account in Settings.");
  }

  const to = contact.email;
  if (!to) throw new Error("No email address found on this contact");

  // 1. Resolve Templates
  const templateIds = Array.isArray(contact.templateSelectionGmail) ? contact.templateSelectionGmail : [];
  let combinedBody = "";
  let finalSubject = contact.editableGmailSubject || `Casting Outreach: ${contact.project || contact.name || "New Project"}`;
  const driveAttachments: DriveFile[] = contact.unified_attachments || [];

  // 1. Custom Message Override (Sent First if present)
  if (contact.hasCustomMessageEmail && contact.editableMessageGmail) {
     combinedBody = contact.editableMessageGmail;
  }

  // 2. Resolve Templates
  for (const tId of templateIds) {
    const template = await queryOne<any>(
      "SELECT content, email_subject, is_attachment, drive_file_id, drive_file_name FROM templates WHERE id = $1 AND user_id = $2",
      [tId, userId]
    );
    if (!template) continue;

    if (template.is_attachment && template.drive_file_id) {
       driveAttachments.push({ id: template.drive_file_id, name: template.drive_file_name, mimeType: "", downloadUrl: "" });
    } else {
       if (template.email_subject && !contact.editableGmailSubject) finalSubject = template.email_subject;
       if (template.content) combinedBody += (combinedBody ? "\n\n" : "") + injectVariables(template.content, contact, "email");
    }
  }

  if (!combinedBody && driveAttachments.length === 0) throw new Error("No email content or attachments selected.");

  // Get sender email from Google profile
  let profileRes: any;
  try {
    profileRes = await gmail.users.getProfile({ userId: "me" });
  } catch (err: any) {
    const isScope = err?.message?.toLowerCase().includes("insufficient") || 
                    err?.code === 403 || 
                    err?.errors?.[0]?.reason === "insufficientPermissions";
    if (isScope) {
      throw new Error(
        "GMAIL_SCOPE_ERROR: Your Google account needs to be re-connected to enable email sending. Please go to Settings → Google Drive & Gmail → Disconnect, then reconnect your account."
      );
    }
    throw new Error(`Gmail error: ${err.message}`);
  }

  const from = profileRes.data.emailAddress || "me";

  const emailAttachments: { filename: string; content: Buffer; mimeType: string }[] = [];
  if (driveAttachments.length > 0) {
    const drive = await getDriveClient(userId);
    for (const file of driveAttachments) {
      try {
        const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
        const meta = await drive.files.get({ fileId: file.id, fields: "mimeType" });
        emailAttachments.push({
          filename: file.name,
          content: Buffer.from(response.data as ArrayBuffer),
          mimeType: meta.data.mimeType || "application/octet-stream",
        });
      } catch (attachErr: any) {
        console.warn(`[outreach] Email attachment failed for ${file.name}:`, attachErr.message);
      }
    }
  }

  const raw = await buildMimeMessage({
    from: `"${contact.name || "CastHub"}" <${from}>`,
    to,
    subject: finalSubject,
    body: combinedBody,
    attachments: emailAttachments,
  });

  let sendRes: any;
  try {
    sendRes = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  } catch (err: any) {
    const isScope = err?.message?.toLowerCase().includes("insufficient") || 
                    err?.code === 403 ||
                    err?.errors?.[0]?.reason === "insufficientPermissions";
    if (isScope) {
      throw new Error(
        "GMAIL_SCOPE_ERROR: Your Google account needs to be re-connected to enable email sending. Please go to Settings → Google Drive & Gmail → Disconnect, then reconnect your account."
      );
    }
    throw new Error(`Gmail send failed: ${err.message}`);
  }
  
  return { messageId: sendRes.data.id, to };
}

// ─── Instagram DM ─────────────────────────────────────────────────────────────

async function handleInstagramOutreach(userId: string, contact: Contact) {
  const session = await queryOne<{ session_data: string }>(
    "SELECT session_data FROM instagram_sessions WHERE user_id = $1 ",
    [userId]
  );
  if (!session) throw new Error("Instagram not connected — please connect in Settings first");

  const handle = (contact.instaHandle || "").replace(/^@/, "");
  if (!handle) throw new Error("No Instagram handle found on this contact");

  // 1. Resolve Templates
  const templateIds = Array.isArray(contact.templateSelectionIG) ? contact.templateSelectionIG : [];
  let combinedMessage = "";
  const attachments: DriveFile[] = contact.unified_attachments || [];

  // 1. Custom Message Override
  if (contact.hasCustomMessageIG && contact.editableMessageIG) {
    combinedMessage = contact.editableMessageIG;
  }

  // 2. Resolve Templates
  for (const tId of templateIds) {
    const template = await queryOne<any>(
      "SELECT content, is_attachment, drive_file_id, drive_file_name FROM templates WHERE id = $1 AND user_id = $2",
      [tId, userId]
    );
    if (!template) continue;

    if (template.is_attachment && template.drive_file_id) {
       attachments.push({ id: template.drive_file_id, name: template.drive_file_name, mimeType: "", downloadUrl: `https://drive.google.com/uc?export=download&id=${template.drive_file_id}` });
    } else if (template.content) {
       combinedMessage += (combinedMessage ? "\n\n" : "") + injectVariables(template.content, contact, "instagram");
    }
  }

  if (!combinedMessage && attachments.length === 0) throw new Error("No Instagram message selected.");

  if (attachments.length > 0) {
    combinedMessage += "\n\nAttachments:";
    for (const file of attachments) {
      combinedMessage += `\n- ${file.name}: https://drive.google.com/uc?export=download&id=${file.id}`;
    }
  }

  return await sendIG([handle], combinedMessage, session.session_data);
}
