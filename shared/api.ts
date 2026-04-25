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
  status: "connected" | "failed" | "pending" | "error";
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  userId: string;
  name: string;
  platform: Platform;
  type: SourceType;
  url?: string;
  description?: string;
  status?: "connected" | "failed" | "pending" | "error";
}

export interface UpdateGroupRequest {
  userId: string;
  name?: string;
  type?: SourceType;
  url?: string;
  description?: string;
  enabled?: boolean;
  status?: "connected" | "failed" | "pending" | "error";
  statusMessage?: string;
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
  automationTrigger?: boolean;
  whatsappNeeded: string; // "Yes" / "No"
  emailNeeded: string;    // "Yes" / "No"
  status: "pending" | "sent" | "failed" | "in progress" | string;
  personalizedNameWA: "N" | "C" | "NA" | string;
  personalizedNameGmail: "N" | "C" | "NA" | string;
  personalizedNameIG?: "N" | "C" | "NA" | string;
  notes: string;
  name: string;
  castingName: string;
  whatsapp: string;
  email: string;
  instaHandle: string;
  visit: string;
  lastContactedDate: string; // Read-only
  followups: string;          // Read-only
  totalDatesContacts: string; // Read-only
  actingContext: string;
  project: string;
  age: string;
  instagramDone: string;      // Read-only
  
  // Custom message triggers
  hasCustomMessageWA?: boolean;
  editableMessageWP: string;
  
  templateSelectionWP: string | string[];
  templateSelectionGmail: string | string[];
  templateSelectionIG?: string | string[];
  
  hasCustomMessageEmail?: boolean;
  editableMessageGmail: string;
  editableGmailSubject: string;
  
  hasCustomMessageIG?: boolean;
  editableMessageIG: string;
  
  specialAttachmentWA: string;
  specialAttachmentGmail: string;
  specialAttachmentIG?: string;
  
  whatsappCompleted: string; // Read-only
  emailCompleted: string;    // Read-only
  instagramCompleted?: string; // Read-only
  
  automationComment: string;
  
  // Internal tracking flags
  whatsappRun?: boolean;
  instagramRun?: boolean;
  emailRun?: boolean;

  // Auto-ingestion & Grouping
  rowColor?: "yellow" | "green" | "red" | "blue" | "transparent" | undefined;
  source?: "manual" | "auto-whatsapp" | "auto-instagram";
  ingestedAt?: string;
  sheetName?: string;

  // Drive Attachments
  drive_attachments_wa?: DriveFile[];
  drive_attachments_email?: DriveFile[];
  drive_attachments_ig?: DriveFile[];
  unified_attachments?: DriveFile[]; // UI helper field that maps identical attachments across platforms

  // Outreach Tracking (Raw data)
  contacted_dates?: string[];
  contact_links?: Record<string, string>;
}

export interface UserAIKeyword {
  word: string;
  active: boolean;
}

export interface UserAIKeywordsResponse {
  keywords: UserAIKeyword[];
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
  emailSubject?: string;
  attachmentUrl?: string;
  attachmentDetailText?: string;
  driveFileId?: string;
  driveFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  userId: string;
  name: string;
  category: TemplateCategory;
  content?: string;
  isAttachment?: boolean;
  emailSubject?: string;
  attachmentUrl?: string;
  attachmentDetailText?: string;
  driveFileId?: string;
  driveFileName?: string;
}

export interface UpdateTemplateRequest {
  userId: string;
  name?: string;
  content?: string;
  isAttachment?: boolean;
  emailSubject?: string;
  attachmentUrl?: string;
  attachmentDetailText?: string;
  driveFileId?: string;
  driveFileName?: string;
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
