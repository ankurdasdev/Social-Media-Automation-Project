import { getGmailClient, getDriveClient } from "../routes/google-auth";
import { sendMessage as sendWA, sendMedia as sendWAMedia } from "./whatsapp-client";
import { sendDirectMessage as sendIG } from "./instagram-client";
import { query, queryOne } from "../db/index";
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

export async function sendOutreach(req: OutreachRequest) {
  const { contactId, userId, channel } = req;

  // 1. Fetch full contact
  const contact = await queryOne<Contact>(
    "SELECT * FROM contacts WHERE id = $1 AND user_id = $2",
    [contactId, userId]
  );
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
        whatsapp_run = CASE WHEN $3 = 'whatsapp' THEN TRUE ELSE whatsapp_run END,
        email_run = CASE WHEN $3 = 'email' THEN TRUE ELSE email_run END,
        instagram_run = CASE WHEN $3 = 'instagram' THEN TRUE ELSE instagram_run END,
        updated_at = NOW()
       WHERE id = $4 AND user_id = $5`,
      [now, JSON.stringify([...contactedDates, now]), channel, contactId, userId]
    );

    return { success: true, result };
  } catch (err: any) {
    console.error(`Outreach failed for contact ${contactId} via ${channel}:`, err);
    await query(
      "UPDATE contacts SET status = 'failed', automation_comment = $1, updated_at = NOW() WHERE id = $2",
      [err.message, contactId]
    );
    throw err;
  }
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

async function handleWhatsAppOutreach(userId: string, contact: Contact) {
  // Get instance that is open
  const instance = await queryOne<{ instance_name: string }>(
    "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
    [userId]
  );
  if (!instance) throw new Error("WhatsApp not connected — please connect in Settings first");

  const rawNumber = (contact.whatsapp || "").replace(/\D/g, "");
  if (!rawNumber) throw new Error("No valid WhatsApp number found on this contact");

  let message = contact.editableMessageWP;
  let templateObj: any = null;
  if (!contact.hasCustomMessageWA && contact.templateSelectionWP) {
    templateObj = await queryOne("SELECT content, is_attachment, attachment_url, drive_file_id, drive_file_name FROM templates WHERE name = $1 AND category = 'whatsapp' AND user_id = $2", [contact.templateSelectionWP, userId]);
    if (templateObj) message = templateObj.content;
  }
  if (!message && !templateObj?.is_attachment) throw new Error("No WhatsApp message selected. Please set a template or custom message.");

  // Build proper JID — Indian numbers need country code
  const jid = rawNumber.includes("@") ? rawNumber : `${rawNumber}@s.whatsapp.net`;

  // Send primary message
  if (message) {
    await sendWA(instance.instance_name, jid, message);
  }

  // Send Drive attachments
  const attachments: DriveFile[] = contact.drive_attachments_wa || [];
  if (templateObj?.is_attachment && templateObj.drive_file_id) {
    attachments.push({
      id: templateObj.drive_file_id,
      name: templateObj.drive_file_name || "Attachment",
      mimeType: "",
      downloadUrl: ""
    });
  }
  if (attachments.length > 0) {
    const drive = await getDriveClient(userId);
    for (const file of attachments) {
      try {
        const response = await drive.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "arraybuffer" }
        );
        const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
        const dataUrl = `data:${file.mimeType};base64,${base64}`;
        await sendWAMedia(instance.instance_name, jid, dataUrl, file.name, file.name);
      } catch (attachErr: any) {
        console.warn(`[outreach] WA attachment failed for ${file.name}:`, attachErr.message);
      }
    }
  }

  return { messageSent: true, attachmentsSent: attachments.length };
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
  const gmail = await getGmailClient(userId);

  const to = contact.email;
  if (!to) throw new Error("No email address found on this contact");

  let body = contact.editableMessageGmail;
  let templateObj: any = null;
  if (!contact.hasCustomMessageEmail && contact.templateSelectionGmail) {
    templateObj = await queryOne("SELECT content, email_subject, is_attachment, drive_file_id, drive_file_name FROM templates WHERE name = $1 AND category = 'email' AND user_id = $2", [contact.templateSelectionGmail, userId]);
    if (templateObj) body = templateObj.content;
  }
  if (!body && !templateObj?.is_attachment) throw new Error("No email body selected. Please set a template or custom message.");

  const subject =
    contact.editableGmailSubject ||
    templateObj?.email_subject ||
    `Casting Outreach: ${contact.project || contact.name || "New Project"}`;

  // Get sender email from Google profile
  const profileRes = await gmail.users.getProfile({ userId: "me" });
  const from = profileRes.data.emailAddress || "me";

  // Download Drive attachments
  const emailAttachments: { filename: string; content: Buffer; mimeType: string }[] = [];
  const driveAttachments: DriveFile[] = contact.drive_attachments_email || [];
  if (templateObj?.is_attachment && templateObj.drive_file_id) {
    driveAttachments.push({
      id: templateObj.drive_file_id,
      name: templateObj.drive_file_name || "Attachment",
      mimeType: "",
      downloadUrl: ""
    });
  }

  if (driveAttachments.length > 0) {
    const drive = await getDriveClient(userId);
    for (const file of driveAttachments) {
      try {
        const response = await drive.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "arraybuffer" }
        );
        emailAttachments.push({
          filename: file.name,
          content: Buffer.from(response.data as ArrayBuffer),
          mimeType: file.mimeType,
        });
      } catch (attachErr: any) {
        console.warn(`[outreach] Email attachment failed for ${file.name}:`, attachErr.message);
      }
    }
  }

  const raw = await buildMimeMessage({
    from: `"${contact.name || "CastHub"}" <${from}>`,
    to,
    subject,
    body,
    attachments: emailAttachments,
  });

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  console.log(`[outreach] Email sent to ${to}, messageId: ${res.data.id}`);
  return { messageId: res.data.id, to };
}

// ─── Instagram DM ─────────────────────────────────────────────────────────────

async function handleInstagramOutreach(userId: string, contact: Contact) {
  const session = await queryOne<{ session_data: string }>(
    "SELECT session_data FROM instagram_sessions WHERE user_id = $1 AND status = 'connected'",
    [userId]
  );
  if (!session) throw new Error("Instagram not connected — please connect in Settings first");

  const handle = (contact.instaHandle || "").replace(/^@/, "");
  if (!handle) throw new Error("No Instagram handle found on this contact");

  let message = contact.editableMessageIG;
  let templateObj: any = null;
  if (!contact.hasCustomMessageIG && contact.templateSelectionIG) {
    templateObj = await queryOne("SELECT content, is_attachment, attachment_url, drive_file_id, drive_file_name FROM templates WHERE name = $1 AND category = 'instagram' AND user_id = $2", [contact.templateSelectionIG, userId]);
    if (templateObj) message = templateObj.content;
  }
  if (!message && !templateObj?.is_attachment) throw new Error("No Instagram message selected. Please set a template or custom message.");

  // Append attachment links to the message text
  let finalMessage = message || "";
  const attachments: DriveFile[] = contact.drive_attachments_ig || [];
  if (templateObj?.is_attachment && templateObj.drive_file_id) {
    attachments.push({
      id: templateObj.drive_file_id,
      name: templateObj.drive_file_name || "Attachment",
      mimeType: "",
      downloadUrl: `https://drive.google.com/uc?export=download&id=${templateObj.drive_file_id}`
    });
  }
  if (attachments.length > 0) {
    finalMessage += "\n\nAttachments:";
    for (const file of attachments) {
      finalMessage += `\n- ${file.name}: ${file.webViewLink}`;
    }
  }

  return await sendIG([handle], finalMessage, session.session_data);
}
