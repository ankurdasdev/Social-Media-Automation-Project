import { RequestHandler } from "express";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../store/templates-store";
import type {
  TemplatesResponse,
  TemplateResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from "@shared/api";

// GET /api/templates
export const handleGetTemplates: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  const { category } = req.query as Record<string, string>;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const templates = await getAllTemplates(userId, category);
    const response: TemplatesResponse = { templates };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

// POST /api/templates
export const handleCreateTemplate: RequestHandler = async (req, res) => {
  const userId = req.body.userId;
  const body = req.body as CreateTemplateRequest;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }
  if (!body.name || !body.category) {
    res.status(400).json({ error: "name and category are required" });
    return;
  }

  try {
    const template = await createTemplate(userId, body);
    const response: TemplateResponse = { template };
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: "Failed to create template" });
  }
};

// PUT /api/templates/:id
export const handleUpdateTemplate: RequestHandler = async (req, res) => {
  const userId = req.body.userId || req.query.userId;
  const { id } = req.params;
  const body = req.body as UpdateTemplateRequest;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const template = await updateTemplate(userId, id, body);
    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    const response: TemplateResponse = { template };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Failed to update template" });
  }
};

// DELETE /api/templates/:id
export const handleDeleteTemplate: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  const { id } = req.params;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const deleted = await deleteTemplate(userId, id);
    if (!deleted) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete template" });
  }
};
