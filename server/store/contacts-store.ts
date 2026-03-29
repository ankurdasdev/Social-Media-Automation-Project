/**
 * Contacts In-Memory Store
 *
 * Shared source of truth for all contacts across the server.
 * Smart upsert: deduplicates by phone → email → name+project combination.
 * Auto-ingested contacts carry rowColor="yellow" and source badges.
 */

import type { Contact } from "@shared/api";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const contacts: Contact[] = [
  {
    id: "uuid-1",
    name: "Deepa Mehta",
    castingName: "Lead Detective",
    project: "Shadows of Mumbai",
    status: "pending",
    whatsapp: "+919876543210",
    email: "deepa.m@example.com",
    instaHandle: "@deepa_acts",
    visit: "https://imdb.com/name/nm12345",
    automationTrigger: true,
    lastContactedDate: "2024-05-12",
    whatsappNeeded: "Yes",
    emailNeeded: "Yes",
    whatsappCompleted: "No",
    emailCompleted: "No",
    instagramDone: "No",
    followups: "0",
    totalDatesContacts: "1",
    age: "28-35",
    actingContext: "Experienced in thriller & procedural drama. Looking for gritty roles.",
    personalizedNameWA: "Deepa",
    personalizedNameGmail: "Deepa",
    templateSelectionWP: "Lead Pitch V1",
    editableMessageWP: "Hi Deepa, loved your work in your last short. We have a lead detective role in 'Shadows of Mumbai' that fits you perfectly. Are you available for a quick chat?",
    specialAttachmentWA: "CharacterSides.pdf",
    templateSelectionGmail: "Formal Pitch",
    editableGmailSubject: "Casting: Lead Role in Shadows of Mumbai",
    editableMessageGmail: "Dear Deepa,\n\nWe are casting for a new procedural drama...",
    specialAttachmentGmail: "",
    notes: "Talent agency requested we loop them in if she proceeds.",
    automationComment: "[05-12] Added to queue.",
    rowColor: "yellow",
    source: "auto-instagram",
    sheetName: "Directors/Producers"
  },
  {
    id: "uuid-2",
    name: "Vikram Singh",
    castingName: "Supporting Lead (Villain)",
    project: "Shadows of Mumbai",
    status: "sent",
    whatsapp: "+919876543211",
    email: "-",
    instaHandle: "@vikram_s_official",
    visit: "Pending",
    automationTrigger: false,
    lastContactedDate: "2024-05-14",
    whatsappNeeded: "Yes",
    emailNeeded: "No",
    whatsappCompleted: "Yes",
    emailCompleted: "No",
    instagramDone: "Yes",
    followups: "2",
    totalDatesContacts: "3",
    age: "40-50",
    actingContext: "Strong screen presence. Has played antagonist in 3 films.",
    personalizedNameWA: "Vikram",
    personalizedNameGmail: "-",
    templateSelectionWP: "Follow Up",
    editableMessageWP: "Hey Vikram, following up on the script we sent out. Any thoughts?",
    specialAttachmentWA: "-",
    templateSelectionGmail: "-",
    editableGmailSubject: "-",
    editableMessageGmail: "-",
    specialAttachmentGmail: "-",
    notes: "Needs higher day rate, checking budget.",
    automationComment: "[05-14] WhatsApp sent successfully.",
    source: "manual",
    sheetName: "All Contacts",
    rowColor: "green"
  },
  {
    id: "uuid-3",
    name: "Aisha Kapoor",
    castingName: "Brand Ambassador",
    project: "Glow Cosmetics Campaign",
    status: "failed",
    whatsapp: "-",
    email: "aisha.k.collabs@example.com",
    instaHandle: "@aishaglows",
    visit: "aishakapoor.com",
    automationTrigger: true,
    lastContactedDate: "2024-05-10",
    whatsappNeeded: "No",
    emailNeeded: "Yes",
    whatsappCompleted: "No",
    emailCompleted: "No",
    instagramDone: "No",
    followups: "0",
    totalDatesContacts: "1",
    age: "20-25",
    actingContext: "Beauty influencer with 500k followers.",
    personalizedNameWA: "-",
    personalizedNameGmail: "Aisha",
    templateSelectionWP: "-",
    editableMessageWP: "-",
    specialAttachmentWA: "-",
    templateSelectionGmail: "Brand Deal Intro",
    editableGmailSubject: "Collaboration: Glow Cosmetics x Aisha",
    editableMessageGmail: "Hi Aisha,\nWe love your aesthetic! Would you be interested...",
    specialAttachmentGmail: "Moodboard_v2.pdf",
    notes: "Her manager is strict. Email only.",
    automationComment: "[05-10] Email bounce: Address rejected by provider.",
    rowColor: "red",
    source: "auto-whatsapp",
    sheetName: "Talent Agencies"
  }
];

let nextId = 100;

// ─── Upsert Logic ─────────────────────────────────────────────────────────────

/**
 * Determine if two contacts represent the same person.
 * Priority: phone match > email match > (name + project) match
 */
function isSamePerson(existing: Contact, incoming: Partial<Contact>): boolean {
  if (existing.whatsapp && incoming.whatsapp) {
    const normalize = (p: string) => p.replace(/\D/g, "").slice(-10);
    if (normalize(existing.whatsapp) === normalize(incoming.whatsapp)) return true;
  }
  if (existing.email && incoming.email) {
    if (existing.email.toLowerCase() === incoming.email.toLowerCase()) return true;
  }
  if (existing.name && incoming.name && existing.project && incoming.project) {
    const sameName = existing.name.toLowerCase() === incoming.name.toLowerCase();
    const sameProject = existing.project.toLowerCase() === incoming.project.toLowerCase();
    if (sameName && sameProject) return true;
  }
  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAllContacts(): Contact[] {
  return [...contacts];
}

export function getContactById(id: string): Contact | undefined {
  return contacts.find((c) => c.id === id);
}

export function createContact(data: Partial<Contact>): Contact {
  const now = new Date().toISOString().split("T")[0];
  const contact: Contact = {
    id: `cct-${nextId++}`,
    automationTrigger: false,
    whatsappNeeded: "",
    emailNeeded: "",
    status: "pending",
    personalizedNameGmail: "",
    personalizedNameWA: "",
    notes: data.notes ?? "",
    name: data.name ?? "",
    castingName: data.castingName ?? "",
    whatsapp: data.whatsapp ?? "",
    email: data.email ?? "",
    instaHandle: data.instaHandle ?? "",
    visit: "",
    lastContactedDate: now,
    followups: "0",
    totalDatesContacts: "1",
    actingContext: data.actingContext ?? "",
    project: data.project ?? "Casting Data",
    age: data.age ?? "",
    instagramDone: "No",
    editableMessageWP: "",
    templateSelectionWP: "",
    templateSelectionGmail: "",
    editableMessageGmail: "",
    editableGmailSubject: "",
    specialAttachmentWA: "",
    specialAttachmentGmail: "",
    whatsappCompleted: "",
    emailCompleted: "",
    automationComment: "",
    rowColor: data.rowColor,
    source: data.source ?? "manual",
    ingestedAt: data.ingestedAt,
  };
  contacts.unshift(contact); // prepend so new rows appear at top
  return contact;
}

export function updateContact(id: string, data: Partial<Contact>): Contact | null {
  const idx = contacts.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  contacts[idx] = { ...contacts[idx], ...data };
  return contacts[idx];
}

export function deleteContact(id: string): boolean {
  const idx = contacts.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  contacts.splice(idx, 1);
  return true;
}

/**
 * Smart upsert for auto-ingested contacts.
 * - If a matching person exists: merge new fields but don't overwrite non-empty ones
 * - If new: create with rowColor="yellow" and source badge
 *
 * Returns: { action: "created" | "updated" | "skipped", contact }
 */
export function upsertContact(
  data: Partial<Contact>,
  source: "auto-whatsapp" | "auto-instagram"
): { action: "created" | "updated" | "skipped"; contact: Contact } {
  const existing = contacts.find((c) => isSamePerson(c, data));

  if (existing) {
    // Update only empty fields — don't overwrite manual edits
    const updates: Partial<Contact> = {};
    if (!existing.castingName && data.castingName) updates.castingName = data.castingName;
    if (!existing.project && data.project) updates.project = data.project;
    if (!existing.age && data.age) updates.age = data.age;
    if (!existing.actingContext && data.actingContext) updates.actingContext = data.actingContext;
    if (!existing.instaHandle && data.instaHandle) updates.instaHandle = data.instaHandle;
    if (!existing.email && data.email) updates.email = data.email;
    if (!existing.whatsapp && data.whatsapp) updates.whatsapp = data.whatsapp;
    if (data.notes) updates.notes = [existing.notes, data.notes].filter(Boolean).join(" | ");

    if (Object.keys(updates).length === 0) {
      return { action: "skipped", contact: existing };
    }

    const updated = updateContact(existing.id, updates)!;
    return { action: "updated", contact: updated };
  }

  // Brand new contact — yellow highlight
  const newContact = createContact({
    ...data,
    rowColor: "yellow",
    source,
    ingestedAt: new Date().toISOString(),
  });

  return { action: "created", contact: newContact };
}
