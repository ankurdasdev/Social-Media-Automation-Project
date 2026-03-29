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

export const handleGetContacts: RequestHandler = (req, res) => {
  let contacts = getAllContacts();

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

export const handleCreateContact: RequestHandler = (req, res) => {
  const { name, email } = req.body;
  if (!name) {
    const response: ErrorResponse = { error: "name is required" };
    res.status(400).json(response);
    return;
  }

  const contact = createContact(req.body);
  const response: ContactResponse = { contact };
  res.status(201).json(response);
};

// ─── PUT /api/contacts/:id ────────────────────────────────────────────────────

export const handleUpdateContact: RequestHandler = (req, res) => {
  const { id } = req.params;
  const updated = updateContact(id, req.body);
  if (!updated) {
    const response: ErrorResponse = { error: "Contact not found" };
    res.status(404).json(response);
    return;
  }
  const response: ContactResponse = { contact: updated };
  res.json(response);
};

// ─── DELETE /api/contacts/:id ─────────────────────────────────────────────────

export const handleDeleteContact: RequestHandler = (req, res) => {
  const { id } = req.params;
  const deleted = deleteContact(id);
  if (!deleted) {
    const response: ErrorResponse = { error: "Contact not found" };
    res.status(404).json(response);
    return;
  }
  res.status(204).send();
};

// ─── POST /api/ingestion/trigger ──────────────────────────────────────────────

export const handleTriggerIngestion: RequestHandler = async (_req, res) => {
  const { isRunning } = getIngestionState();
  if (isRunning) {
    res.status(409).json({ error: "Ingestion job is already running" });
    return;
  }

  // Fire and forget — respond immediately, job runs in background
  res.json({ message: "Ingestion job started", startedAt: new Date().toISOString() });

  // Run in background (don't await — response is already sent)
  runIngestionJob().catch((err) =>
    console.error("[ingestion] Background run error:", err)
  );
};

// ─── GET /api/ingestion/status ────────────────────────────────────────────────

export const handleIngestionStatus: RequestHandler = (_req, res) => {
  const { isRunning, lastRun } = getIngestionState();

  // Next midnight IST = 18:30 UTC today or tomorrow
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
