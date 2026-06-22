import { getGmailClient, getDriveClient } from "../routes/google-auth";
import { sendMessage as sendWA, sendMedia as sendWAMedia } from "./whatsapp-client";
import { sendDirectMessage as sendIG, sendDirectPhoto as sendIGPhoto } from "./instagram-client";
import { query, queryOne } from "../db/index";
import { getContactById } from "../store/contacts-store";
import { DriveFile, Contact } from "@shared/api";

/**
 * Outreach Orchestrator
 * Handles sending messages across different channels with support for Drive attachments.
 */

export interface OutreachRequest extends Partial<Contact> {
  contactId: string;
  userId: string;
  channel?: "whatsapp" | "email" | "instagram";
  channels?: ("whatsapp" | "email" | "instagram")[];
}

function stripExtension(filename: string): string {
  if (!filename) return "";
  return filename.replace(/\.[^/.]+$/, "");
}

function cleanHtmlForPlainText(content: string): string {
  if (!content) return "";
  let text = content;
  
  // Replace break and paragraph tags with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");
  
  // Replace bold and italic tags
  text = text.replace(/<(b|strong)[^>]*>(.*?)<\/\1>/gi, "*$2*");
  text = text.replace(/<(i|em)[^>]*>(.*?)<\/\1>/gi, "_$2_");
  
  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text.trim();
}

function injectVariables(content: string, contact: Contact, channel: "whatsapp" | "email" | "instagram"): string {
  if (!content) return "";
  let result = content;
  
  // Resolve specific salutations for each channel (Base greetings)
  const baseSalutationWA = contact.salutationWA || "Hi";
  const baseSalutationGmail = contact.salutationEmail || "Hi";
  const baseSalutationIG = contact.salutationIG || "Hi";

  // Resolve personalized name based on selection
  const personalizedWA = 
    contact.personalizedNameWA === "N" && contact.name ? contact.name :
    contact.personalizedNameWA === "C" && contact.castingName ? contact.castingName :
    "Sir/Mam";

  const personalizedGmail = 
    contact.personalizedNameGmail === "N" && contact.name ? contact.name :
    contact.personalizedNameGmail === "C" && contact.castingName ? contact.castingName :
    "Sir/Mam";

  const personalizedIG = 
    contact.personalizedNameIG === "N" && contact.name ? contact.name :
    contact.personalizedNameIG === "C" && contact.castingName ? contact.castingName :
    "Sir/Mam";
  
  const pName = contact.name || "Talent";
  const cName = contact.castingName || "the casting";

  const variables = [
    { name: "leadName", value: pName },
    { name: "name", value: pName },
    { name: "castingName", value: cName },
    { name: "age", value: contact.age || "the age bracket" },
    { name: "project", value: contact.project || "Project" },
    { name: "actingContext", value: contact.actingContext || "the role" },
    { name: "whatsapp", value: contact.whatsapp || "" },
    { name: "email", value: contact.email || "" },
    { name: "instaHandle", value: contact.instaHandle || "" },
    
    { name: "personalizedWP", value: personalizedWA },
    { name: "personalizedGmail", value: personalizedGmail },
    { name: "personalizedIG", value: personalizedIG },
    
    { name: "salutation", value: channel === "whatsapp" ? baseSalutationWA : channel === "email" ? baseSalutationGmail : baseSalutationIG },
  ];

  variables.forEach((v) => {
    const regex = new RegExp(`{{${v.name}}}`, "g");
    result = result.replace(regex, v.value);
  });

  return result;
}

export async function sendOutreach(req: OutreachRequest) {
  const { contactId, userId } = req;
  const channels = req.channels || (req.channel ? [req.channel] : []);

  if (channels.length === 0) {
    return { success: true, message: "No channels specified" };
  }

  // 1. Fetch full contact properly mapped
  const contact = await getContactById(userId, contactId);
  if (!contact) throw new Error("Contact not found");

  // Merge request overrides into contact data for this run
  const data = { ...contact, ...req };

  const results: Record<string, { success: boolean; error?: string; result?: any }> = {};
  const contactedDates = Array.isArray(contact.contacted_dates) ? contact.contacted_dates : [];

  // Run in parallel with a 60-second timeout safeguard per channel
  const promises = channels.map(async (channel) => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout (stalled)")), 60000)
    );
    const executePromise = (async () => {
      if (channel === "whatsapp") {
        return await handleWhatsAppOutreach(userId, data);
      } else if (channel === "email") {
        return await handleEmailOutreach(userId, data);
      } else if (channel === "instagram") {
        return await handleInstagramOutreach(userId, data);
      }
      throw new Error(`Unsupported channel: ${channel}`);
    })();

    try {
      const res = await Promise.race([executePromise, timeoutPromise]);
      results[channel] = { success: true, result: res };
    } catch (err: any) {
      console.error(`Outreach channel ${channel} failed for contact ${contactId}:`, err.message);
      results[channel] = { success: false, error: err.message || "Unknown error" };
    }
  });

  await Promise.all(promises);

  // Analyze consolidated results
  const attemptedCount = channels.length;
  const successes = channels.filter(c => results[c]?.success);
  const failures = channels.filter(c => !results[c]?.success);

  const now = new Date().toISOString();
  const errorsList = failures.map(c => `[${c.toUpperCase()}]: ${results[c].error}`);
  const automationComment = errorsList.length > 0 ? errorsList.join(" | ") : null;

  // Single consolidated database update
  let statusUpdate = contact.status;
  if (successes.length > 0) {
    statusUpdate = 'sent';
  } else if (failures.length > 0) {
    statusUpdate = contact.status === 'sent' ? 'sent' : 'failed';
  }

  const updatedDates = successes.length > 0 ? JSON.stringify([...contactedDates, now]) : JSON.stringify(contactedDates);
  const lastContactedUpdate = successes.length > 0 ? now : contact.lastContactedDate;

  const waCompleted = channels.includes("whatsapp") ? (results["whatsapp"]?.success ? "Yes" : "Failed") : contact.whatsappCompleted;
  const emailCompleted = channels.includes("email") ? (results["email"]?.success ? "Yes" : "Failed") : contact.emailCompleted;
  const igCompleted = channels.includes("instagram") ? (results["instagram"]?.success ? "Yes" : "Failed") : contact.instagramCompleted;
  const igDone = channels.includes("instagram") ? (results["instagram"]?.success ? "Yes" : contact.instagramDone) : contact.instagramDone;

  const waRun = channels.includes("whatsapp") ? true : !!contact.whatsappRun;
  const emailRun = channels.includes("email") ? true : !!contact.emailRun;
  const igRun = channels.includes("instagram") ? true : !!contact.instagramRun;

  // Increment follow_ups exactly ONCE per run if at least one channel was attempted
  const followUpsIncrement = attemptedCount > 0 ? 1 : 0;

  await query(
    `UPDATE contacts SET 
      status = $1,
      last_contacted = $2,
      contacted_dates = $3,
      automation_comment = $4,
      whatsapp_completed = $5,
      email_completed = $6,
      instagram_completed = $7,
      instagram_done = $8,
      whatsapp_run = $9,
      email_run = $10,
      instagram_run = $11,
      follow_ups = COALESCE(follow_ups, 0) + $12,
      updated_at = NOW()
     WHERE id = $13 AND user_id = $14`,
    [
      statusUpdate,
      lastContactedUpdate,
      updatedDates,
      automationComment,
      waCompleted,
      emailCompleted,
      igCompleted,
      igDone,
      waRun,
      emailRun,
      igRun,
      followUpsIncrement,
      contactId,
      userId
    ]
  );

  if (successes.length === 0 && failures.length > 0) {
    throw new Error(errorsList.join(" | "));
  }

  return { success: true, results };
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function handleWhatsAppOutreach(userId: string, contact: Contact) {
  const instance = await queryOne<{ instance_name: string }>(
    "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1 ",
    [userId]
  );
  if (!instance) throw new Error("WhatsApp not connected — please connect in Settings first");

  const rawNumber = (contact.whatsapp || "").replace(/\D/g, "");
  if (!rawNumber) throw new Error("No valid WhatsApp number found on this contact");
  const jid = rawNumber.includes("@") ? rawNumber : `${rawNumber}@s.whatsapp.net`;

  const drive = await getDriveClient(userId);

  // Helper to send a Drive file as WhatsApp media
  const sendDriveFile = async (file: DriveFile) => {
    try {
      const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
      const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
      const meta = await drive.files.get({ fileId: file.id, fields: "mimeType" });
      const mimeType = meta.data.mimeType || "application/octet-stream";
      
      let mediaType: "image" | "document" = "document";
      if (mimeType.startsWith("image/")) mediaType = "image";

      const finalName = file.customName || file.name;
      const cleanName = stripExtension(finalName);
      const caption = file.caption || cleanName;

      await sendWAMedia(instance.instance_name, jid, base64, mediaType, caption, finalName);
    } catch (err: any) {
      console.warn(`[whatsapp] Attachment failed for ${file.name}:`, err.message);
    }
    await sleep(1500);
  };

  // 1. Custom Message (Sent First)
  if (contact.hasCustomMessageWA && contact.editableMessageWP) {
      const cleanMsg = cleanHtmlForPlainText(contact.editableMessageWP);
      await sendWA(instance.instance_name, jid, cleanMsg);
      await sleep(1500);
  }

  // 2. Templates in Order
  const templateIds = Array.isArray(contact.templateSelectionWP) ? contact.templateSelectionWP : [];
  for (const tId of templateIds) {
    const template = await queryOne<any>(
      "SELECT content, is_attachment, drive_file_id, drive_file_name, drive_attachments FROM templates WHERE id = $1 AND user_id = $2",
      [tId, userId]
    );
    if (!template) continue;

    if (template.is_attachment) {
       const attachments = template.drive_attachments || (template.drive_file_id ? [{
         id: template.drive_file_id,
         name: template.drive_file_name || "",
       }] : []);
       
       for (const file of attachments) {
         if (file.id) {
           await sendDriveFile(file as DriveFile);
         }
       }
    } else if (template.content) {
       const message = injectVariables(template.content, contact, "whatsapp");
       const cleanMsg = cleanHtmlForPlainText(message);
       await sendWA(instance.instance_name, jid, cleanMsg);
       await sleep(1500);
    }
  }

  // 3. Row Attachments
  const rowAttachments: DriveFile[] = [
    ...(contact.drive_attachments_wa || []),
    ...(contact.unified_attachments || [])
  ];
  for (const file of rowAttachments) {
    await sendDriveFile(file);
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
  isHtml?: boolean;
  attachments?: { filename: string; content: Buffer; mimeType: string }[];
}): Promise<string> {
  const boundary = `boundary_casthub_${Date.now()}`;
  const lines: string[] = [];

  const isMultipart = opts.attachments && opts.attachments.length > 0;
  const contentType = opts.isHtml ? 'text/html' : 'text/plain';

  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  lines.push(`Subject: ${opts.subject}`);
  lines.push(`MIME-Version: 1.0`);

  if (isMultipart) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push(``);
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${contentType}; charset="UTF-8"`);
    lines.push(`Content-Transfer-Encoding: base64`);
    lines.push(``);
    const b64Body = Buffer.from(opts.body, "utf-8").toString("base64");
    for (let i = 0; i < b64Body.length; i += 76) {
      lines.push(b64Body.slice(i, i + 76));
    }

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
    lines.push(`Content-Type: ${contentType}; charset="UTF-8"`);
    lines.push(`Content-Transfer-Encoding: base64`);
    lines.push(``);
    const b64Body = Buffer.from(opts.body, "utf-8").toString("base64");
    for (let i = 0; i < b64Body.length; i += 76) {
      lines.push(b64Body.slice(i, i + 76));
    }
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

  // Get sender email
  const user = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = $1", [userId]);
  if (!user) throw new Error("User account not found");
  const from = user.email;

  const drive = await getDriveClient(userId);

  // 1. Fetch Row Attachments (Used for every email)
  const rowAttachments: DriveFile[] = [
    ...(contact.drive_attachments_email || []),
    ...(contact.unified_attachments || [])
  ];

  const emailAttachments: { filename: string; content: Buffer; mimeType: string }[] = [];
  for (const file of rowAttachments) {
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

  const sendEmail = async (subject: string, body: string, isHtml: boolean = false) => {
    const raw = await buildMimeMessage({
      from: `"${contact.name || "CastHub"}" <${from}>`,
      to,
      subject,
      body,
      isHtml,
      attachments: emailAttachments,
    });
    try {
      return await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    } catch (err: any) {
      const isScope = err?.message?.toLowerCase().includes("insufficient") || 
                      err?.code === 403 ||
                      err?.errors?.[0]?.reason === "insufficientPermissions";
      if (isScope) {
        throw new Error(
          "GMAIL_SCOPE_ERROR: Your Google account permissions are insufficient. " +
          "Please go to Settings → Google Drive & Gmail → Disconnect, then reconnect. " +
          "IMPORTANT: During the Google login, if you see a 'This app isn't verified' screen, click 'Advanced' → 'Go to ... (unsafe)'. " +
          "Then, you MUST check the box that says 'Send email on your behalf'."
        );
      }
      throw new Error(`Gmail send failed: ${err.message}`);
    }
  };

  // 2. Compose Email (Custom Message OR Body Template + Footer)
  const templateIds = Array.isArray(contact.templateSelectionGmail) ? contact.templateSelectionGmail : [];
  const useCustomMessage = !!(contact.hasCustomMessageEmail && contact.editableMessageGmail);
  
  if (templateIds.length > 0 || useCustomMessage) {
    // Fetch all selected templates
    const selectedTemplates: any[] = [];
    if (templateIds.length > 0) {
      for (const tId of templateIds) {
        const template = await queryOne<any>(
          "SELECT content, email_subject, is_attachment, drive_file_id, drive_file_name, drive_attachments, email_template_type FROM templates WHERE id = $1 AND user_id = $2",
          [tId, userId]
        );
        if (template) {
          selectedTemplates.push(template);
        }
      }
    }

    // Find first Body template and first Footer template
    // Attachment templates are handled separately as file attachments
    const bodyTemplate = selectedTemplates.find(t => t.email_template_type === "body" && !t.is_attachment);
    const footerTemplate = selectedTemplates.find(t => t.email_template_type === "footer" && !t.is_attachment);
    // All attachment templates
    const attachmentTemplates = selectedTemplates.filter(t => t.is_attachment);

    // Compose elements
    // Priority 1: Contact row subject. Priority 2: Body template subject.
    let composedSubject = contact.editableGmailSubject?.trim() || (bodyTemplate?.email_subject?.trim()) || "";
    
    if (!composedSubject) {
      throw new Error("Missing email subject. Please provide a subject in the Contact record or the Body Template.");
    }

    let composedBody = "";

    if (useCustomMessage) {
      composedBody = contact.editableMessageGmail;
    } else if (bodyTemplate) {
      composedBody = injectVariables(bodyTemplate.content || "", contact, "email");
    }

    if (footerTemplate) {
      const footerContent = injectVariables(footerTemplate.content || "", contact, "email");
      if (composedBody) {
        composedBody += "<br><br>" + footerContent;
      } else {
        composedBody = footerContent;
      }
    }

    // Normalize HTML formatting for Gmail rendering
    let finalHtml = composedBody;
    
    // If it's a legacy plain-text template (no structural HTML tags), convert newlines
    if (!/<(?:p|div|br)[^>]*>/i.test(finalHtml)) {
      finalHtml = finalHtml.replace(/\n/g, "<br>");
    } else {
      // Strip bloated default margins from <p> tags by replacing them with 0-margin divs
      finalHtml = finalHtml.replace(/<p[^>]*>/gi, '<div style="margin: 0; padding: 0;">').replace(/<\/p>/gi, '</div>');
      // Also remove massive line-heights sometimes carried over from word processors
      finalHtml = finalHtml.replace(/line-height:\s*[^;"]+;?/gi, '');
    }

    // Combine attachments from selected templates + row attachments
    const thisTemplateAttachments = [...emailAttachments]; // Start with row attachments

    // Helper: download a Drive file and add to attachment list
    const downloadAndAddAttachment = async (template: any) => {
      const attachments = template.drive_attachments || (template.drive_file_id ? [{
        id: template.drive_file_id,
        name: template.drive_file_name || "",
      }] : []);
      
      for (const file of attachments) {
        if (!file.id) continue;
        try {
          const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
          const meta = await drive.files.get({ fileId: file.id, fields: "mimeType,name" });
          const fileName = file.customName || file.name || meta.data.name || "attachment";
          thisTemplateAttachments.push({
            filename: fileName,
            content: Buffer.from(response.data as ArrayBuffer),
            mimeType: meta.data.mimeType || "application/octet-stream",
          });
        } catch (attachErr: any) {
          console.warn(`[outreach] Email attachment template download failed for ${file.name}:`, attachErr.message);
        }
      }
    };

    // Process body template attachments (if it has any drive files embedded)
    if (!useCustomMessage && bodyTemplate) await downloadAndAddAttachment(bodyTemplate);
    // Process footer template attachments
    if (footerTemplate) await downloadAndAddAttachment(footerTemplate);
    // *** FIX: Process all attachment-type templates ***
    for (const attTemplate of attachmentTemplates) {
      await downloadAndAddAttachment(attTemplate);
    }

    // Send the composed email (preserving HTML formatting)
    const raw = await buildMimeMessage({
      from: `"${contact.name || "CastHub"}" <${from}>`,
      to,
      subject: composedSubject,
      body: finalHtml,
      isHtml: true,
      attachments: thisTemplateAttachments,
    });

    try {
      await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    } catch (err: any) {
      const isScope = err?.message?.toLowerCase().includes("insufficient") || 
                      err?.code === 403 ||
                      err?.errors?.[0]?.reason === "insufficientPermissions";
      if (isScope) {
        throw new Error(
          "GMAIL_SCOPE_ERROR: Your Google account permissions are insufficient. " +
          "Please go to Settings → Google Drive & Gmail → Disconnect, then reconnect."
        );
      }
      throw new Error(`Gmail send failed: ${err.message}`);
    }
  }
  
  return { success: true };
}

// ─── Instagram DM ─────────────────────────────────────────────────────────────

async function handleInstagramOutreach(userId: string, contact: Contact) {
  const session = await queryOne<{ session_data: string }>(
    "SELECT session_data FROM instagram_sessions WHERE user_id = $1 ",
    [userId]
  );
  if (!session) throw new Error("Instagram not connected — please connect in Settings first");

  const handle = (contact.instaHandle || "").replace(/^@\s*/, "").trim();
  if (!handle) throw new Error("No Instagram handle found on this contact");

  const drive = await getDriveClient(userId);

  // Helper to send a Drive file as Instagram attachment
  const sendDriveFileAsIG = async (fileId: string, fileName: string) => {
    try {
      const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data as ArrayBuffer);
      const meta = await drive.files.get({ fileId, fields: "mimeType" });
      const mimeType = meta.data.mimeType || "application/octet-stream";

      if (mimeType.startsWith("image/")) {
        // Send as actual photo file via the new VPS photo upload route!
        await sendIGPhoto([handle], buffer, fileName, session.session_data);
      } else {
        // Fallback: send as a download URL link for non-images
        const msg = `Attachment: ${stripExtension(fileName)} - https://drive.google.com/uc?export=download&id=${fileId}`;
        await sendIG([handle], msg, session.session_data);
      }
    } catch (err: any) {
      console.warn(`[instagram] Direct attachment failed for ${fileName}:`, err.message);
      // Fallback in case Google Drive or photo upload fails
      try {
        const msg = `Attachment: ${stripExtension(fileName)} - https://drive.google.com/uc?export=download&id=${fileId}`;
        await sendIG([handle], msg, session.session_data);
      } catch (fallbackErr: any) {
        console.warn(`[instagram] Fallback text link failed for ${fileName}:`, fallbackErr.message);
      }
    }
    await sleep(1500);
  };

  // 1. Custom Message (Sent First)
  if (contact.hasCustomMessageIG && contact.editableMessageIG) {
     const cleanMsg = cleanHtmlForPlainText(contact.editableMessageIG);
     await sendIG([handle], cleanMsg, session.session_data);
     await sleep(1500);
  }

  // 2. Templates in Order
  const templateIds = Array.isArray(contact.templateSelectionIG) ? contact.templateSelectionIG : [];
  for (const tId of templateIds) {
    const template = await queryOne<any>(
      "SELECT content, is_attachment, drive_file_id, drive_file_name, drive_attachments FROM templates WHERE id = $1 AND user_id = $2",
      [tId, userId]
    );
    if (!template) continue;

    if (template.is_attachment) {
       const attachments = template.drive_attachments || (template.drive_file_id ? [{
         id: template.drive_file_id,
         name: template.drive_file_name || "",
       }] : []);
       
       for (const file of attachments) {
         if (file.id) {
           await sendDriveFileAsIG(file.id, file.name);
         }
       }
    } else if (template.content) {
       const message = injectVariables(template.content, contact, "instagram");
       const cleanMsg = cleanHtmlForPlainText(message);
       await sendIG([handle], cleanMsg, session.session_data);
       await sleep(1500);
    }
  }

  // 3. Row Attachments
  const rowAttachments: DriveFile[] = [
    ...(contact.drive_attachments_ig || []),
    ...(contact.unified_attachments || [])
  ];
  for (const file of rowAttachments) {
    await sendDriveFileAsIG(file.id, file.name);
  }

  return { success: true };
}
