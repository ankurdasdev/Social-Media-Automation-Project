import { RequestHandler } from "express";
import nodemailer from "nodemailer";
import type { HelpAskRequest, HelpAskResponse, ContactFormPayload, ContactFormResponse, FeedbackPayload, HelpCategory } from "@shared/api";
import { HELP_CATEGORIES } from "@shared/api";
import { queryOne } from "../db/index";

// ─── Platform knowledge base for AI Assistant ──────────────────────────────
const PLATFORM_KNOWLEDGE = `
You are an expert help bot for CastHub — a multi-platform casting automation dashboard.
CastHub lets casting directors manage contacts, send automated outreach via WhatsApp, Email, and Instagram, create message templates, and track analytics.

Key features you know about:
- **Contacts page**: Add/edit/delete casting contacts. Supports bulk import via Excel. Color-code rows. Full-text AI search.
- **Source Manager**: Configure WhatsApp groups and Instagram threads for auto-ingestion of casting calls.
- **Template Library**: Create reusable message templates for WhatsApp, Email, and Instagram with variable placeholders ({name}, {project}).
- **Integrations Centre**: Connect WhatsApp (via QR code), Instagram (via credentials), and Google Drive (OAuth) for file attachments.
- **Analytics**: View outreach success/failure rates, AI failure diagnosis, conversion funnels, and chat with an AI data analyst.
- **Subscription**: Weekly (₹199) or Monthly (₹499) plans via Razorpay. Coupon codes available.
- **Profile**: Update name, email, password, gender, DOB. View subscription status and payment history.
- **Auto-Ingestion**: The system automatically scans connected WhatsApp groups and Instagram threads for new casting calls and adds them as contacts.
- **AI Features**: AI-powered contact search, message improvement, failure diagnosis, image-to-contact parsing.
- **Keyboard Shortcuts**: Ctrl+K for search, Ctrl+N for new contact, F11 for fullscreen table, Esc to close dialogs.

Rules:
1. NEVER request or share personal user data.
2. Keep answers concise (2-4 sentences max).
3. Be friendly and helpful.
4. If you don't know something, say so and suggest contacting support via the Contact form.
5. Always prefix your answer with 🤖.
`;

/**
 * Simple AI answer generator.
 * In production, replace with a real LLM API call (OpenAI, Gemini, etc.)
 */
async function generateAnswer(question: string): Promise<string> {
  const q = question.toLowerCase().trim();

  // Pattern-match common questions
  const answers: Record<string, string> = {
    // Contacts
    "how do i add a contact": "🤖 Navigate to the **Contacts** page and click the **+ Add Contact** button in the toolbar. You can also bulk-import contacts by uploading an Excel file using the import button.",
    "how to import contacts": "🤖 On the **Contacts** page, click the **Excel Import** button in the toolbar. Upload your .xlsx file and map the columns to CastHub fields. The system will auto-detect most column names.",
    "how to color rows": "🤖 Right-click on any row in the Contacts table to open the context menu, then select **Row Color** to pick from solid colors, custom hex, or premium gradients.",
    "how to search contacts": "🤖 Use the search bar at the top of the Contacts page for text search, or click the **AI Search** button to use natural language queries like 'find all contacts from Mumbai who haven't been contacted'.",
    "how to delete contacts": "🤖 Select contacts using the checkboxes, then click the **Delete** button in the bulk actions toolbar. You can also right-click a single row and choose Delete.",

    // Templates
    "how to create a template": "🤖 Go to the **Template Library** page and click **+ New Template**. Choose a category (WhatsApp, Email, or Instagram), give it a name, and write your message. Use `{name}` and `{project}` as dynamic placeholders.",
    "what are template variables": "🤖 Template variables like `{name}`, `{project}`, and `{castingName}` are automatically replaced with each contact's actual data when sending outreach messages.",

    // Integrations
    "how to connect whatsapp": "🤖 Go to **Integrations Centre** and click **Connect** under WhatsApp. A QR code will appear — scan it with your WhatsApp mobile app (Settings → Linked Devices → Link a Device).",
    "how to connect instagram": "🤖 Go to **Integrations Centre** and click **Connect** under Instagram. Enter your Instagram credentials. If 2FA is enabled, you'll be prompted for the verification code.",
    "how to connect google drive": "🤖 Go to **Integrations Centre** and click **Connect** under Google Drive. You'll be redirected to Google's OAuth flow. Grant the requested permissions to link your Drive for file attachments.",

    // Analytics
    "how to view analytics": "🤖 Navigate to the **Analytics** page from the sidebar. You'll see outreach stats, success/failure rates, funnel analysis, and an AI chatbot you can ask questions about your data.",

    // Subscription
    "how to upgrade": "🤖 Go to the **Subscription** page from the sidebar. Choose your plan (Weekly ₹199 or Monthly ₹499), optionally apply a coupon code, and complete payment via Razorpay (UPI, Cards, NetBanking, or Wallets).",
    "how to cancel subscription": "🤖 Currently, subscriptions expire naturally at the end of your billing period. For immediate cancellation, please contact support through the **Contact** form on this page.",

    // Source Manager
    "what is source manager": "🤖 The **Source Manager** lets you configure WhatsApp groups and Instagram threads for automatic casting call detection. The system scans these sources daily and creates contacts from any casting calls found.",
    "how to add a source": "🤖 Go to **Source Manager** and click **+ Add New Source**. Select the platform (WhatsApp or Instagram), choose the group/thread, and enable it. The system will start scanning it for casting calls.",

    // General
    "what is casthub": "🤖 CastHub is a casting automation platform that helps casting directors manage contacts and send personalized outreach messages via WhatsApp, Email, and Instagram — all from one dashboard.",

    // Conversational
    "hello": "🤖 Hello there! I'm the CastHub Assistant. How can I help you today?",
    "hi": "🤖 Hi! How can I assist you with CastHub today?",
    "hey": "🤖 Hey! What can I help you with?",
    "how are you": "🤖 I'm just a bunch of code, but I'm doing great! How can I help you with your casting automation today?",
    "who are you": "🤖 I'm the CastHub AI Assistant, designed to help you navigate and use the platform efficiently.",
    "who made you": "🤖 I was created by the team behind CastHub to provide you with instant support and answers.",
    "thanks": "🤖 You're welcome! Let me know if you need anything else.",
    "thank you": "🤖 Happy to help! Feel free to ask if you have more questions.",
  };

  // Try exact match first
  for (const [key, answer] of Object.entries(answers)) {
    if (q === key || q === key + "?" || q === key + "!") {
      return answer;
    }
    // Also catch exact matches within sentences for conversational ones
    if (["hello", "hi", "hey", "thanks", "thank you"].includes(key) && q.includes(key)) {
        return answer;
    }
  }

  // Try keyword matching
  if (q.includes("how are you")) return answers["how are you"];
  if (q.includes("who are you") || q.includes("who is this")) return answers["who are you"];
  if (q.includes("who made") || q.includes("who created")) return answers["who made you"];
  if (q.includes("contact") && (q.includes("add") || q.includes("create") || q.includes("new"))) return answers["how do i add a contact"];
  if (q.includes("import") || q.includes("excel") || q.includes("upload")) return answers["how to import contacts"];
  if (q.includes("color") || q.includes("row")) return answers["how to color rows"];
  if (q.includes("search") || q.includes("find")) return answers["how to search contacts"];
  if (q.includes("template") && (q.includes("create") || q.includes("make") || q.includes("new"))) return answers["how to create a template"];
  if (q.includes("variable") || q.includes("placeholder")) return answers["what are template variables"];
  if (q.includes("whatsapp") && q.includes("connect")) return answers["how to connect whatsapp"];
  if (q.includes("instagram") && q.includes("connect")) return answers["how to connect instagram"];
  if (q.includes("google") || q.includes("drive")) return answers["how to connect google drive"];
  if (q.includes("analytics") || q.includes("stats") || q.includes("report")) return answers["how to view analytics"];
  if (q.includes("upgrade") || q.includes("plan") || q.includes("pricing") || q.includes("subscribe")) return answers["how to upgrade"];
  if (q.includes("cancel")) return answers["how to cancel subscription"];
  if (q.includes("source") && q.includes("manager")) return answers["what is source manager"];
  if (q.includes("source") && q.includes("add")) return answers["how to add a source"];
  if (q.includes("what") && q.includes("casthub")) return answers["what is casthub"];
  if (q.includes("delete") && q.includes("contact")) return answers["how to delete contacts"];

  // Fallback
  return "🤖 Great question! I don't have a specific answer for that yet. I'd suggest checking the **FAQ section** on this page, or submitting your question through the **Contact Form** — our team will get back to you within 24 hours.";
}

// ─── Handlers ──────────────────────────────────────────────────────────────

export const handleAskHelp: RequestHandler = async (req, res) => {
  const { query } = req.body as HelpAskRequest;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }
  try {
    const answer = await generateAnswer(query);
    const response: HelpAskResponse = { answer };
    res.json(response);
  } catch (err) {
    console.error("[help] AI error:", err);
    res.status(500).json({ error: "Failed to generate answer" });
  }
};

export const handleContactForm: RequestHandler = async (req, res) => {
  const { name, email, category, message } = req.body as ContactFormPayload;

  if (!name?.trim() || !email?.trim() || !category?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (message.trim().length < 20) {
    return res.status(400).json({ error: "Message must be at least 20 characters" });
  }

  try {
    // Try to get admin notification email from app_settings
    let adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@casthub.in";
    try {
      const setting = await queryOne<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = 'admin_notification_email'"
      );
      if (setting?.value) adminEmail = setting.value;
    } catch { /* use fallback */ }

    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS.replace(/\s+/g, ""),
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const subject = `Enquiry Request - ${category}`;
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const info = await transporter.sendMail({
      from: `"CastHub Help" <${process.env.SMTP_USER || "no-reply@casthub.in"}>`,
      to: adminEmail,
      subject,
      text: `New Support Enquiry\n\nName: ${name}\nEmail: ${email}\nCategory: ${category}\nTimestamp: ${timestamp}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px 32px;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: -0.5px;">⚡ CastHub — New Support Enquiry</h2>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 12px 0; color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Name</td>
                <td style="padding: 12px 0; font-weight: bold;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 12px 0; color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Email</td>
                <td style="padding: 12px 0;"><a href="mailto:${email}" style="color: #7c3aed; text-decoration: none;">${email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 12px 0; color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Category</td>
                <td style="padding: 12px 0;"><span style="background: rgba(124,58,237,0.2); color: #a78bfa; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: bold;">${category}</span></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Time</td>
                <td style="padding: 12px 0; color: rgba(255,255,255,0.5); font-size: 12px;">${timestamp}</td>
              </tr>
            </table>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px;">
              <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Message</p>
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message.replace(/\n/g, "<br/>")}</p>
            </div>
          </div>
        </div>
      `,
    });

    if (!process.env.SMTP_USER) {
      console.log(`[help] 📧 Contact email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    const response: ContactFormResponse = {
      success: true,
      preview: process.env.SMTP_USER ? undefined : (nodemailer.getTestMessageUrl(info) as string),
    };
    res.json(response);
  } catch (err) {
    console.error("[help] Contact email error:", err);
    res.status(500).json({ error: "Failed to send enquiry. Please try again later." });
  }
};

export const handleFeedback: RequestHandler = async (req, res) => {
  const { rating, context, comment } = req.body as FeedbackPayload;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  // Log feedback (can be persisted to DB later)
  console.log(`[help] ⭐ Feedback received: ${rating}/5 stars (${context})${comment ? ` — "${comment}"` : ""}`);

  res.json({ success: true, message: "Thank you for your feedback!" });
};
