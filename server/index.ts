import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { handleDemo } from "./routes/demo";
import {
  handleGetGroups,
  handleCreateGroup,
  handleUpdateGroup,
  handleDeleteGroup,
} from "./routes/groups";
import {
  handleGetContacts,
  handleCreateContact,
  handleBulkCreateContacts,
  handleUpdateContact,
  handleDeleteContact,
  handleTriggerIngestion,
  handleIngestionStatus,
  handleAIContactSearch,
  handleGetAnalyticsStats,
  handleAIDiagnoseFailures,
  handleAnalyticsChat,
  handleParseContactImage,
} from "./routes/contacts";
import {
  handleGetTemplates,
  handleCreateTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
} from "./routes/templates";
import {
  handleGoogleAuth,
  handleGoogleCallback,
  handleGoogleStatus,
  handleGoogleDisconnect,
  handleCheckGoogleScopes,
  handleSetDriveFolder,
} from "./routes/google-auth";
import {
  handleSearchDriveFiles,
  handleListDriveFolders,
} from "./routes/drive";
import {
  handleWhatsAppStatus,
  handleWhatsAppConnect,
  handleWhatsAppQR,
  handleWhatsAppDisconnect,
  handleWhatsAppSyncGroups,
  handleWhatsAppSendMessage,
} from "./routes/whatsapp-auth";
import {
  handleInstagramStatus,
  handleInstagramConnect,
  handleInstagramConnectSession,
  handleInstagramServiceConfig,
  handleInstagramDisconnect,
  handleInstagramSyncThreads,
  handleInstagramSendMessage,
} from "./routes/instagram-auth";
import { handleSendOutreach } from "./routes/outreach";
import { handleGetSalutations, handleAddSalutation } from "./routes/salutations";
import { handleImproveMessage } from "./routes/ai-routes";
import { handleAskHelp, handleContactForm, handleFeedback } from "./routes/help";
import { 
  handleSignup, 
  handleLogin, 
  handleMe, 
  handleUpdateProfile, 
  handleResetPassword, 
  handleResetPasswordConfirm,
  handleGetAIKeywords,
  handleUpdateAIKeywords,
  handleDeleteAccount,
  handleVerifyEmail,
  handleResendVerification,
  handleCompleteOnboarding,
} from "./routes/auth";
import { runIngestionJob } from "./jobs/ingestion-job";
import { initIngestionSchedules, ingestionRouter } from "./routes/ingestion-schedule";
import { initDb } from "./db/index";
import { 
  requireAdmin,
  handleGetUsers,
  handleUpdateUser,
  handleAdminResetPassword,
  handleAdminResendVerification,
  handleGetAnalytics,
  handleGetLogs
} from "./routes/admin";
import {
  handleGetSubscription,
  handleCreateOrder,
  handleVerifyPayment,
  handleApplyCoupon,
  handleCancelSubscription,
  handleGetPaymentHistory,
  handleWebhook,
} from "./routes/payments";

// Initialize database then restore per-user ingestion schedules
initDb()
  .then(() => initIngestionSchedules())
  .catch(console.error);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ── System Routes ──────────────────────────────────────────────────────────
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });



  app.get("/api/system/init-db", async (_req, res) => {
    try {
      await initDb();
      res.json({ message: "Database initialized successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/demo", handleDemo);

  // ── Authentication ──────────────────────────────────────────────────────────
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", handleMe);
  app.put("/api/auth/profile", handleUpdateProfile);
  app.post("/api/auth/reset-password", handleResetPassword);
  app.post("/api/auth/reset-password/confirm", handleResetPasswordConfirm);
  app.get("/api/auth/keywords", handleGetAIKeywords);
  app.put("/api/auth/keywords", handleUpdateAIKeywords);
  app.delete("/api/auth/delete-account", handleDeleteAccount);
  app.get("/api/auth/verify-email", handleVerifyEmail);
  app.post("/api/auth/resend-verification", handleResendVerification);
  app.post("/api/auth/complete-onboarding", handleCompleteOnboarding);

  // ── Admin Dashboard ────────────────────────────────────────────────────────
  app.get("/api/admin/users", requireAdmin, handleGetUsers);
  app.patch("/api/admin/users/:id", requireAdmin, handleUpdateUser);
  app.post("/api/admin/users/:id/reset-password", requireAdmin, handleAdminResetPassword);
  app.post("/api/admin/users/:id/resend-verification", requireAdmin, handleAdminResendVerification);
  app.get("/api/admin/analytics", requireAdmin, handleGetAnalytics);
  app.get("/api/admin/logs", requireAdmin, handleGetLogs);

  // ── Payments ───────────────────────────────────────────────────────────────
  app.get("/api/payments/subscription", handleGetSubscription);
  app.post("/api/payments/create-order", handleCreateOrder);
  app.post("/api/payments/verify", handleVerifyPayment);
  app.post("/api/payments/apply-coupon", handleApplyCoupon);
  app.post("/api/payments/cancel", handleCancelSubscription);
  app.get("/api/payments/history", handleGetPaymentHistory);
  app.post("/api/payments/webhook", handleWebhook);

  // ── Admin Payment/Coupon/Settings Routes ────────────────────────────────────
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      const payments = await q(`
        SELECT p.*, u.name as user_name, u.email as user_email
        FROM payments p LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC LIMIT 500
      `);
      res.json({ payments });
    } catch (err) { res.status(500).json({ error: "Failed to fetch payments" }); }
  });

  app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      const subs = await q(`
        SELECT s.*, u.name as user_name, u.email as user_email
        FROM subscriptions s LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.updated_at DESC
      `);
      res.json({ subscriptions: subs });
    } catch (err) { res.status(500).json({ error: "Failed to fetch subscriptions" }); }
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      const { code, discountPercent, maxUses, validUntil } = req.body;
      if (!code || !discountPercent) return res.status(400).json({ error: "code and discountPercent required" });
      await q(
        `INSERT INTO coupons (code, discount_percent, max_uses, valid_until) VALUES ($1, $2, $3, $4)`,
        [code.toUpperCase().trim(), discountPercent, maxUses || 0, validUntil || null]
      );
      res.json({ success: true });
    } catch (err: any) {
      if (err.code === "23505") return res.status(400).json({ error: "Coupon code already exists" });
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });

  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      const coupons = await q("SELECT * FROM coupons ORDER BY created_at DESC");
      res.json({ coupons });
    } catch (err) { res.status(500).json({ error: "Failed to fetch coupons" }); }
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      await q("UPDATE coupons SET is_active = false WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to deactivate coupon" }); }
  });

  app.post("/api/admin/users/:id/revoke-trial", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      await q(
        `UPDATE subscriptions SET status = 'expired', trial_end = NOW(), updated_at = NOW() WHERE user_id = $1`,
        [req.params.id]
      );
      res.json({ success: true, message: "Trial revoked" });
    } catch (err) { res.status(500).json({ error: "Failed to revoke trial" }); }
  });

  app.post("/api/admin/users/:id/extend-trial", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      const { days } = req.body;
      await q(
        `UPDATE subscriptions SET status = 'trialing', trial_end = NOW() + ($1 || ' days')::interval, updated_at = NOW() WHERE user_id = $2`,
        [days || 7, req.params.id]
      );
      res.json({ success: true, message: `Trial extended by ${days || 7} days` });
    } catch (err) { res.status(500).json({ error: "Failed to extend trial" }); }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      const rows = await q("SELECT key, value FROM app_settings");
      const settings: Record<string, string> = {};
      rows.forEach((r: any) => { settings[r.key] = r.value; });
      // Defaults
      if (!settings.admin_notification_email) settings.admin_notification_email = process.env.ADMIN_NOTIFICATION_EMAIL || "ankmuz007@gmail.com";
      res.json({ settings });
    } catch (err) { res.status(500).json({ error: "Failed to fetch settings" }); }
  });

  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { query: q } = await import("./db/index");
      const { key, value } = req.body;
      if (!key || !value) return res.status(400).json({ error: "key and value required" });
      await q(
        `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to update settings" }); }
  });

  // ── Source Group Management ────────────────────────────────────────────────
  app.get("/api/groups", handleGetGroups);
  app.post("/api/groups", handleCreateGroup);
  app.put("/api/groups/:id", handleUpdateGroup);
  app.delete("/api/groups/:id", handleDeleteGroup);

  // ── Contacts ───────────────────────────────────────────────────────────────
  app.get("/api/contacts", handleGetContacts);
  app.post("/api/contacts", handleCreateContact);
  app.post("/api/contacts/bulk", handleBulkCreateContacts);
  app.put("/api/contacts/:id", handleUpdateContact);
  app.delete("/api/contacts/:id", handleDeleteContact);
  app.post("/api/contacts/ai-search", handleAIContactSearch);
  app.post("/api/contacts/parse-image", handleParseContactImage);
  app.post("/api/ai/improve-message", handleImproveMessage);
  app.get("/api/analytics/stats", handleGetAnalyticsStats);
  app.post("/api/analytics/diagnose-failures", handleAIDiagnoseFailures);
  app.post("/api/analytics/chat", handleAnalyticsChat);

  // ── Ingestion Job (legacy trigger endpoint kept for backward compat) ────────
  app.post("/api/ingestion/trigger", handleTriggerIngestion);
  // ── Ingestion Schedule (configurable time per user) ─────────────────────────
  app.use("/api/ingestion", ingestionRouter);

  // ── Templates ──────────────────────────────────────────────────────────────
  app.get("/api/templates", handleGetTemplates);
  app.post("/api/templates", handleCreateTemplate);
  app.put("/api/templates/:id", handleUpdateTemplate);
  app.delete("/api/templates/:id", handleDeleteTemplate);

  // ── Google OAuth + Drive ───────────────────────────────────────────────────────
  app.get("/api/auth/google", handleGoogleAuth);
  app.get("/api/auth/google/callback", handleGoogleCallback);
  app.get("/api/auth/google/status", handleGoogleStatus);
  app.get("/api/auth/google/check-scopes", handleCheckGoogleScopes);
  app.delete("/api/auth/google", handleGoogleDisconnect);
  app.put("/api/auth/google/folder", handleSetDriveFolder);
  app.get("/api/drive/files", handleSearchDriveFiles);
  app.get("/api/drive/folders", handleListDriveFolders);

  // ── WhatsApp Auth ─────────────────────────────────────────────────────────
  app.get("/api/whatsapp/status", handleWhatsAppStatus);
  app.post("/api/whatsapp/connect", handleWhatsAppConnect);
  app.get("/api/whatsapp/qr", handleWhatsAppQR);
  app.delete("/api/whatsapp/disconnect", handleWhatsAppDisconnect);
  app.post("/api/whatsapp/sync-groups", handleWhatsAppSyncGroups);
  app.post("/api/whatsapp/send-message", handleWhatsAppSendMessage);

  // ── Instagram (instagrapi-rest, per-user sessions) ─────────────────────────────────
  app.get("/api/instagram/status", handleInstagramStatus);
  app.get("/api/instagram/service-config", handleInstagramServiceConfig);
  app.post("/api/instagram/connect", handleInstagramConnect);
  app.post("/api/instagram/connect-session", handleInstagramConnectSession);
  app.delete("/api/instagram/disconnect", handleInstagramDisconnect);
  app.get("/api/instagram/sync-threads", handleInstagramSyncThreads);
  app.post("/api/instagram/send-message", handleInstagramSendMessage);

 
  // ── Help & Support ──────────────────────────────────────────────────────────
  app.post("/api/help/ask", handleAskHelp);
  app.post("/api/help/contact", handleContactForm);
  app.post("/api/help/feedback", handleFeedback);

  // ── Outreach ───────────────────────────────────────────────────────────────
  app.post("/api/outreach/send", handleSendOutreach);

  // ── Salutations ────────────────────────────────────────────────────────────
  app.get("/api/salutations", handleGetSalutations);
  app.post("/api/salutations", handleAddSalutation);

  return app;
}
