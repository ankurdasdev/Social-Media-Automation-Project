import { getGmailClient, getDriveClient } from "../routes/google-auth";
import { sendMessage as sendWA, sendMedia as sendWAMedia } from "./whatsapp-client";
import { sendDirectMessage as sendIG } from "./instagram-client";
import { query, queryOne } from "../db/index";
import { DriveFile, Contact } from "@shared/api";
import nodemailer from "nodemailer";
import { google } from "googleapis";

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

  // 1. Fetch full contact to have all defaults if not in req
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
      [
        now,
        JSON.stringify([...contactedDates, now]),
        channel,
        contactId,
        userId
      ]
    );

    return { success: true, result };
  } catch (err: any) {
    console.error(`Outreach failed for contact ${contactId} via ${channel}:`, err);
    await query(
      "UPDATE contacts SET status = 'failed', automation_comment = $1 WHERE id = $2",
      [err.message, contactId]
    );
    throw err;
  }
}

async function handleWhatsAppOutreach(userId: string, contact: Contact) {
  // Get instance status
  const instance = await queryOne<{ instance_name: string }>(
    "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1 AND status = 'open'",
    [userId]
  );
  if (!instance) throw new Error("WhatsApp not connected or instance not open");

  const number = (contact.whatsapp || "").replace(/\D/g, "");
  if (!number) throw new Error("No valid WhatsApp number found");

  const message = contact.hasCustomMessageWA ? contact.editableMessageWP : contact.templateSelectionWP;
  if (!message) throw new Error("No WhatsApp message or template selected");

  // Send primary message
  await sendWA(instance.instance_name, number, message);

  // Send attachments
  const attachments = contact.drive_attachments_wa || [];
  const drive = await getDriveClient(userId);

  for (const file of attachments) {
    // Fetch file as base64 for Evolution API
    const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
    const dataUrl = `data:${file.mimeType};base64,${base64}`;

    await sendWAMedia(instance.instance_name, number, dataUrl, file.name, file.name);
  }

  return { messageSent: true, attachmentsSent: attachments.length };
}

async function handleEmailOutreach(userId: string, contact: Contact) {
  const gmail = await getGmailClient(userId);
  const drive = await getDriveClient(userId);

  const to = contact.email;
  if (!to) throw new Error("No email address found");

  const subject = contact.editableGmailSubject || `Casting Outreach: ${contact.project || "New Project"}`;
  const body = contact.hasCustomMessageEmail ? contact.editableMessageGmail : contact.templateSelectionGmail;
  if (!body) throw new Error("No Email body or template selected");

  // Build MIME message with attachments
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });

  const emailAttachments = [];
  const driveAttachments = contact.drive_attachments_email || [];

  for (const file of driveAttachments) {
    const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
    emailAttachments.push({
      filename: file.name,
      content: Buffer.from(response.data as ArrayBuffer),
      contentType: file.mimeType,
    });
  }

  const mailOptions = {
    from: "me", // Gmail ignores this and uses the authorized user's email
    to,
    subject,
    text: body,
    attachments: emailAttachments,
  };

  const info = await transporter.sendMail(mailOptions);
  const raw = Buffer.from(info.message as Buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return res.data;
}

async function handleInstagramOutreach(userId: string, contact: Contact) {
  const session = await queryOne<{ session_data: string }>(
    "SELECT session_data FROM instagram_sessions WHERE user_id = $1 AND status = 'connected'",
    [userId]
  );
  if (!session) throw new Error("Instagram not connected");

  const handle = (contact.instaHandle || "").replace("@", "");
  if (!handle) throw new Error("No Instagram handle found");

  const message = contact.hasCustomMessageIG ? contact.editableMessageIG : contact.templateSelectionIG;
  if (!message) throw new Error("No Instagram message or template selected");

  // For IG, we append attachment links to the message if any
  let finalMessage = message;
  const attachments = contact.drive_attachments_ig || [];
  if (attachments.length > 0) {
    finalMessage += "\n\nAttachments:";
    for (const file of attachments) {
      finalMessage += `\n- ${file.name}: ${file.webViewLink}`;
    }
  }

  // We need the target's internal PK/ID for direct message usually, 
  // but let's assume our instagrapi-rest handles username resolution or we have it.
  // Actually, handleIGOutreach should probably resolve the username first.
  
  // Note: instagrapi-rest sendDirectMessage takes userIds (PKs).
  // We might need to resolve handle -> PK.
  
  return await sendIG([handle], finalMessage, session.session_data);
}
