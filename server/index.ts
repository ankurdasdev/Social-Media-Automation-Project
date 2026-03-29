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
import { runIngestionJob } from "./jobs/ingestion-job";

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

  app.get("/api/demo", handleDemo);

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
