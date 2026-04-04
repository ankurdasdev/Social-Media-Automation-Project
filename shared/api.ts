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

// ─── Google Drive ─────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  downloadUrl: string;
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
  user_id: string;
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

  // Multi-User / Drive Attachments (JSONB in DB)
  drive_attachments_wa?: DriveFile[];
  drive_attachments_email?: DriveFile[];
  drive_attachments_ig?: DriveFile[];

  // Outreach Tracking
  contacted_dates?: string[];
  contact_links?: Record<string, string>;
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
  user_id: string;
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

// ─── WhatsApp Auth (Evolution API) ──────────────────────────────────────────

export type WhatsAppStatus = "open" | "connecting" | "disconnected" | "pairing" | "close";

export interface WhatsAppInstanceStatus {
  instanceName: string;
  status: WhatsAppStatus;
  isPaused: boolean;
  webhookUrl?: string;
}

export interface WhatsAppQRResponse {
  qrcode: {
    base64: string;
    code: string;
    count: number;
  };
}

export interface WhatsAppStatusResponse {
  instance: WhatsAppInstanceStatus | null;
  isConnected: boolean;
}

// ─── Instagram Auth (instagrapi-rest) ───────────────────────────────────────

export interface InstagramStatusResponse {
  isConnected: boolean;
  username: string | null;
  connectedAt: string | null;
}

export interface InstagramLoginRequest {
  username: string;
  password?: string;
  verificationCode?: string;
  proxy?: string;
}

export interface InstagramLoginResponse {
  success: boolean;
  message?: string;
  twoFactorRequired?: boolean;
  twoFactorInfo?: {
    two_factor_identifier: string;
    obfuscated_phone_number?: string;
    method?: string;
  };
}
