/**
 * Contacts API Routes
 *
 * GET    /api/contacts                  - list all contacts (with filters)
 * POST   /api/contacts                  - create a contact manually
 * PUT    /api/contacts/:id              - update a contact
 * DELETE /api/contacts/:id              - delete a contact
 * POST   /api/ingestion/trigger         - manually trigger the ingestion job
 * GET    /api/ingestion/status          - last run status + next run time
 */

import { RequestHandler } from "express";
import {
  getAllContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../store/contacts-store";
import { runIngestionJob, getIngestionState } from "../jobs/ingestion-job";
import type { ContactsResponse, ContactResponse, ErrorResponse, IngestionStatusResponse } from "@shared/api";

// ─── GET /api/contacts ────────────────────────────────────────────────────────

export const handleGetContacts: RequestHandler = async (req, res) => {
  const userId = (req.query.userId as string) || process.env.DEFAULT_USER_ID;
  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID in .env or pass it as a query param." });
    return;
  }

  let contacts = await getAllContacts(userId);

  const { search, status, project, source } = req.query as Record<string, string>;

  if (search) {
    const q = search.toLowerCase();
    contacts = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.whatsapp.includes(q) ||
        c.instaHandle.toLowerCase().includes(q) ||
        c.castingName.toLowerCase().includes(q)
    );
  }

  if (status && status !== "all") {
    contacts = contacts.filter((c) => c.status === status);
  }

  if (project && project !== "all") {
    contacts = contacts.filter((c) => c.project === project);
  }

  if (source && source !== "all") {
    contacts = contacts.filter((c) => c.source === source);
  }

  const response: ContactsResponse = { contacts, total: contacts.length };
  res.json(response);
};

// ─── POST /api/contacts ───────────────────────────────────────────────────────

export const handleCreateContact: RequestHandler = async (req, res) => {
  const userId = req.body.userId || process.env.DEFAULT_USER_ID; 
  const { name } = req.body;
  
  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID in .env or pass it in the body." });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const contact = await createContact(userId, req.body);
  const response: ContactResponse = { contact };
  res.status(201).json(response);
};

// ─── PUT /api/contacts/:id ────────────────────────────────────────────────────

export const handleUpdateContact: RequestHandler = async (req, res) => {
  const userId = req.body.userId || req.query.userId || process.env.DEFAULT_USER_ID;
  const { id } = req.params;

  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID or pass it." });
    return;
  }

  const updated = await updateContact(userId, id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  const response: ContactResponse = { contact: updated };
  res.json(response);
};

// ─── DELETE /api/contacts/:id ─────────────────────────────────────────────────

export const handleDeleteContact: RequestHandler = async (req, res) => {
  const userId = (req.query.userId as string) || (req.body.userId as string) || process.env.DEFAULT_USER_ID;
  const { id } = req.params;

  if (!userId) {
    res.status(400).json({ error: "userId is required. Please set DEFAULT_USER_ID or pass it." });
    return;
  }

  const deleted = await deleteContact(userId, id);
  if (!deleted) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.status(204).send();
};

// ─── POST /api/ingestion/trigger ──────────────────────────────────────────────

export const handleTriggerIngestion: RequestHandler = async (req, res) => {
  // Global trigger for now, though it will process all users
  const { isRunning } = getIngestionState();
  if (isRunning) {
    res.status(409).json({ error: "Ingestion job is already running" });
    return;
  }

  res.json({ message: "Ingestion job started", startedAt: new Date().toISOString() });

  runIngestionJob().catch((err) =>
    console.error("[ingestion] Background run error:", err)
  );
};

// ─── GET /api/ingestion/status ────────────────────────────────────────────────

export const handleIngestionStatus: RequestHandler = (_req, res) => {
  const { isRunning, lastRun } = getIngestionState();

  const now = new Date();
  const nextRun = new Date();
  nextRun.setUTCHours(18, 30, 0, 0); // midnight IST
  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  const response: IngestionStatusResponse = {
    isRunning,
    lastRun,
    nextRunAt: nextRun.toISOString(),
  };

  res.json(response);
};
