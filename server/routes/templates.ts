import { RequestHandler } from "express";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
} from "../store/templates-store";
import type {
  TemplatesResponse,
  TemplateResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from "@shared/api";

// GET /api/templates?category=whatsapp
export const handleGetTemplates: RequestHandler = (req, res) => {
  const { category } = req.query as Record<string, string>;
  const templates = getAllTemplates(category);
  const response: TemplatesResponse = { templates };
  res.json(response);
};

// POST /api/templates
export const handleCreateTemplate: RequestHandler = (req, res) => {
  const body = req.body as CreateTemplateRequest;
  if (!body.name || !body.category) {
    res.status(400).json({ error: "name and category are required" });
    return;
  }
  const template = createTemplate(body);
  const response: TemplateResponse = { template };
  res.status(201).json(response);
};

// PUT /api/templates/:id
export const handleUpdateTemplate: RequestHandler = (req, res) => {
  const { id } = req.params;
  const body = req.body as UpdateTemplateRequest;
  const template = updateTemplate(id, body);
  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  const response: TemplateResponse = { template };
  res.json(response);
};

// DELETE /api/templates/:id
export const handleDeleteTemplate: RequestHandler = (req, res) => {
  const { id } = req.params;
  const deleted = deleteTemplate(id);
  if (!deleted) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  res.status(204).send();
};
