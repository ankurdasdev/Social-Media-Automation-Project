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
} from "./routes/whatsapp-auth";
import {
  handleInstagramStatus,
  handleInstagramConnect,
  handleInstagramDisconnect,
} from "./routes/instagram-auth";
import { handleSendOutreach } from "./routes/outreach";
import { handleSignup, handleLogin, handleMe } from "./routes/auth";
import { runIngestionJob } from "./jobs/ingestion-job";
import { initDb } from "./db/index";

// Initialize database on startup
initDb().catch(console.error);

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

  // ── Ingestion Job ──────────────────────────────────────────────────────────
  app.post("/api/ingestion/trigger", handleTriggerIngestion);
  app.get("/api/ingestion/status", handleIngestionStatus);

  // ── Templates ──────────────────────────────────────────────────────────────
  app.get("/api/templates", handleGetTemplates);
  app.post("/api/templates", handleCreateTemplate);
  app.put("/api/templates/:id", handleUpdateTemplate);
  app.delete("/api/templates/:id", handleDeleteTemplate);

  // ── Google OAuth + Drive ───────────────────────────────────────────────────────
  app.get("/api/auth/google", handleGoogleAuth);
  app.get("/api/auth/google/callback", handleGoogleCallback);
  app.get("/api/auth/google/status", handleGoogleStatus);
  app.delete("/api/auth/google", handleGoogleDisconnect);
  app.put("/api/auth/google/folder", handleSetDriveFolder);
  app.get("/api/drive/files", handleSearchDriveFiles);
  app.get("/api/drive/folders", handleListDriveFolders);

  // ── WhatsApp Auth ──────────────────────────────────────────────────────────
  app.get("/api/whatsapp/status", handleWhatsAppStatus);
  app.post("/api/whatsapp/connect", handleWhatsAppConnect);
  app.get("/api/whatsapp/qr", handleWhatsAppQR);
  app.delete("/api/whatsapp/disconnect", handleWhatsAppDisconnect);

  // ── Instagram Auth ─────────────────────────────────────────────────────────
  app.get("/api/instagram/status", handleInstagramStatus);
  app.post("/api/instagram/connect", handleInstagramConnect);
  app.delete("/api/instagram/disconnect", handleInstagramDisconnect);
 
  // ── Outreach ───────────────────────────────────────────────────────────────
  app.post("/api/outreach/send", handleSendOutreach);

  // ── Daily Cron Scheduler ───────────────────────────────────────────────────
  // Runs every day at midnight IST (18:30 UTC)
  // Cron format: minute hour day month weekday
  cron.schedule(
    "30 18 * * *",
    async () => {
      console.log("[cron] Daily ingestion job triggered at midnight IST");
      try {
        await runIngestionJob();
      } catch (err) {
        console.error("[cron] Ingestion job failed:", err);
      }
    },
    {
      timezone: "UTC",
    }
  );

  console.log("[server] Daily ingestion cron scheduled: runs at 00:00 IST (18:30 UTC)");

  return app;
}
