/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ─── Source Group Management ─────────────────────────────────────────────────

export type Platform = "whatsapp" | "instagram";
export type SourceType = "group" | "account" | "hashtag" | "channel";

export interface SourceGroup {
  id: string;
  name: string;
  platform: Platform;
  type: SourceType;
  url?: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  platform: Platform;
  type: SourceType;
  url?: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  type?: SourceType;
  url?: string;
  description?: string;
  enabled?: boolean;
}

export interface GroupsResponse {
  groups: SourceGroup[];
}

export interface GroupResponse {
  group: SourceGroup;
}

export interface ErrorResponse {
  error: string;
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  automationTrigger: boolean;
  whatsappNeeded: string;
  emailNeeded: string;
  status: "pending" | "sent" | "failed";
  personalizedNameGmail: string;
  personalizedNameWA: string;
  notes: string;
  name: string;
  castingName: string;
  whatsapp: string;
  email: string;
  instaHandle: string;
  visit: string;
  lastContactedDate: string;
  followups: string;
  totalDatesContacts: string;
  actingContext: string;
  project: string;
  age: string;
  instagramDone: string;
  editableMessageWP: string;
  templateSelectionWP: string;
  templateSelectionGmail: string;
  editableMessageGmail: string;
  editableGmailSubject: string;
  specialAttachmentWA: string;
  specialAttachmentGmail: string;
  whatsappCompleted: string;
  emailCompleted: string;
  automationComment: string;
  // Instagram specific outreach
  personalizedNameIG?: string;
  templateSelectionIG?: string;
  editableMessageIG?: string;
  specialAttachmentIG?: string;
  
  // Phase 9: Customization Form Extensions
  salutationWA?: string;
  salutationIG?: string;
  salutationEmail?: string;
  hasCustomMessageWA?: boolean;
  hasCustomMessageIG?: boolean;
  hasCustomMessageEmail?: boolean;

  // Phase 10: Inline Editable Automation Triggers
  whatsappRun?: boolean;
  instagramRun?: boolean;
  emailRun?: boolean;

  // Auto-ingestion fields
  rowColor?: "yellow" | "green" | "red" | "blue" | "transparent" | undefined;
  source?: "manual" | "auto-whatsapp" | "auto-instagram";
  ingestedAt?: string;
  sheetName?: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

export interface ContactResponse {
  contact: Contact;
}

// ─── Ingestion ────────────────────────────────────────────────────────────────

export interface IngestionRunResult {
  runAt: string;
  durationMs: number;
  sourcesProcessed: number;
  messagesScanned: number;
  castingCallsFound: number;
  contactsCreated: number;
  contactsUpdated: number;
  contactsSkipped: number;
  errors: string[];
}

export interface IngestionStatusResponse {
  isRunning: boolean;
  lastRun: IngestionRunResult | null;
  nextRunAt: string; // ISO string - midnight IST
}


// ─── Template Management ──────────────────────────────────────────────────────

export type TemplateCategory = "whatsapp" | "email" | "instagram";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  isAttachment: boolean;
  attachmentUrl?: string;
  attachmentDetailText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  category: TemplateCategory;
  content?: string;
  isAttachment?: boolean;
  attachmentUrl?: string;
  attachmentDetailText?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  content?: string;
  isAttachment?: boolean;
  attachmentUrl?: string;
  attachmentDetailText?: string;
}

export interface TemplatesResponse {
  templates: Template[];
}

export interface TemplateResponse {
  template: Template;
}
