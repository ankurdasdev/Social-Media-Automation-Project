/**
 * Templates In-Memory Store
 * CRUD for WhatsApp, Email, and Instagram outreach templates.
 */

import type { Template, CreateTemplateRequest, UpdateTemplateRequest } from "@shared/api";

function uid(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const now = new Date().toISOString();

const templates: Template[] = [
  {
    id: "tpl-wa-1",
    name: "WA Intro Pitch",
    category: "whatsapp",
    content: "Hi {{name}}, we're casting for {{project}} and believe your profile as {{actingContext}} is a great fit. Are you available for a quick call?",
    isAttachment: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tpl-wa-2",
    name: "WA Follow Up",
    category: "whatsapp",
    content: "Hey {{name}}, just following up on our casting outreach for {{project}}. Would love to discuss the {{castingName}} role with you!",
    isAttachment: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tpl-email-1",
    name: "Email Formal Pitch",
    category: "email",
    content: "Dear {{name}},\n\nWe are currently casting for {{project}} and are interested in you for the role of {{castingName}}.\n\nYour profile matches what we are looking for ({{actingContext}}, age {{age}}). We would love to schedule a meeting.\n\nBest regards,\nThe Casting Team",
    isAttachment: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tpl-ig-1",
    name: "IG DM Intro",
    category: "instagram",
    content: "Hey {{name}}! We came across your profile and think you'd be perfect for {{castingName}} in {{project}}. Interested in learning more? 🎬",
    isAttachment: false,
    createdAt: now,
    updatedAt: now,
  },
];

export function getAllTemplates(category?: string): Template[] {
  if (category) return templates.filter((t) => t.category === category);
  return [...templates];
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function createTemplate(data: CreateTemplateRequest): Template {
  const t: Template = {
    id: uid(),
    name: data.name,
    category: data.category,
    content: data.content ?? "",
    isAttachment: data.isAttachment ?? false,
    attachmentUrl: data.attachmentUrl,
    attachmentDetailText: data.attachmentDetailText,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  templates.push(t);
  return t;
}

export function updateTemplate(id: string, data: UpdateTemplateRequest): Template | null {
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  templates[idx] = {
    ...templates[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return templates[idx];
}

export function deleteTemplate(id: string): boolean {
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  templates.splice(idx, 1);
  return true;
}
