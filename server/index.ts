import "dotenv/config";
import express from "express";
import cors from "cors";
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
  handleUpdateContact,
  handleDeleteContact,
  handleTriggerIngestion,
  handleIngestionStatus,
  handleAIContactSearch,
  handleGetAnalyticsStats,
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
import { 
  handleSignup, 
  handleLogin, 
  handleMe, 
  handleUpdateProfile, 
  handleResetPassword, 
  handleResetPasswordConfirm,
  handleGetAIKeywords,
  handleUpdateAIKeywords
} from "./routes/auth";
import { runIngestionJob } from "./jobs/ingestion-job";
import { initIngestionSchedules, ingestionRouter } from "./routes/ingestion-schedule";
import { initDb } from "./db/index";

// Initialize database then restore per-user ingestion schedules
initDb()
  .then(() => initIngestionSchedules())
  .catch(console.error);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // ── Source Group Management ────────────────────────────────────────────────
  app.get("/api/groups", handleGetGroups);
  app.post("/api/groups", handleCreateGroup);
  app.put("/api/groups/:id", handleUpdateGroup);
  app.delete("/api/groups/:id", handleDeleteGroup);

  // ── Contacts ───────────────────────────────────────────────────────────────
  app.get("/api/contacts", handleGetContacts);
  app.post("/api/contacts", handleCreateContact);
  app.put("/api/contacts/:id", handleUpdateContact);
  app.delete("/api/contacts/:id", handleDeleteContact);
  app.post("/api/contacts/ai-search", handleAIContactSearch);
  app.post("/api/ai/improve-message", handleImproveMessage);
  app.get("/api/analytics/stats", handleGetAnalyticsStats);

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

 
  // ── Outreach ───────────────────────────────────────────────────────────────
  app.post("/api/outreach/send", handleSendOutreach);

  // ── Salutations ────────────────────────────────────────────────────────────
  app.get("/api/salutations", handleGetSalutations);
  app.post("/api/salutations", handleAddSalutation);

  return app;
}
