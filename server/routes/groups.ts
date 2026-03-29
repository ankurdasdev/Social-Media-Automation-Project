import { RequestHandler } from "express";
import { z } from "zod";
import type {
  SourceGroup,
  GroupsResponse,
  GroupResponse,
  ErrorResponse,
} from "@shared/api";

// ─── In-Memory Store ─────────────────────────────────────────────────────────

const _groups: SourceGroup[] = [
  {
    id: "seed-wa-1",
    name: "Casting Calls - Mumbai",
    platform: "whatsapp",
    type: "group",
    url: "",
    description: "Main casting call group for Mumbai-based auditions",
    enabled: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "seed-wa-2",
    name: "Actor Network India",
    platform: "whatsapp",
    type: "group",
    url: "",
    description: "Pan-India actor networking group",
    enabled: true,
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "seed-wa-3",
    name: "Bollywood Extras Club",
    platform: "whatsapp",
    type: "group",
    url: "",
    description: "Group for extra/junior artist casting calls",
    enabled: false,
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-02-01T10:00:00Z",
  },
  {
    id: "seed-ig-1",
    name: "casting_calls_india",
    platform: "instagram",
    type: "account",
    url: "https://instagram.com/casting_calls_india",
    description: "Popular IG page posting daily casting calls",
    enabled: true,
    createdAt: "2024-01-16T10:00:00Z",
    updatedAt: "2024-01-16T10:00:00Z",
  },
  {
    id: "seed-ig-2",
    name: "bollywood_auditions",
    platform: "instagram",
    type: "account",
    url: "https://instagram.com/bollywood_auditions",
    description: "Bollywood audition announcements",
    enabled: false,
    createdAt: "2024-01-12T10:00:00Z",
    updatedAt: "2024-01-12T10:00:00Z",
  },
  {
    id: "seed-ig-3",
    name: "#castingcallmumbai",
    platform: "instagram",
    type: "hashtag",
    url: "https://instagram.com/explore/tags/castingcallmumbai",
    description: "Hashtag for Mumbai casting calls",
    enabled: true,
    createdAt: "2024-02-05T10:00:00Z",
    updatedAt: "2024-02-05T10:00:00Z",
  },
];

let nextId = 100;

/** Read-only accessor for the ingestion job and other services */
export function getGroupsList(): SourceGroup[] {
  return _groups;
}

// rename the raw array so names don't clash

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  platform: z.enum(["whatsapp", "instagram"]),
  type: z.enum(["group", "account", "hashtag", "channel"]),
  url: z.string().max(500).optional().default(""),
  description: z.string().max(1000).optional().default(""),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["group", "account", "hashtag", "channel"]).optional(),
  url: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  enabled: z.boolean().optional(),
});

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * GET /api/groups
 * Query params: platform (optional), search (optional)
 */
export const handleGetGroups: RequestHandler = (req, res) => {
  let result = [..._groups];

  const platform = req.query.platform as string | undefined;
  if (platform && (platform === "whatsapp" || platform === "instagram")) {
    result = result.filter((g) => g.platform === platform);
  }

  const search = req.query.search as string | undefined;
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }

  const response: GroupsResponse = { groups: result };
  res.json(response);
};

/**
 * POST /api/groups
 */
export const handleCreateGroup: RequestHandler = (req, res) => {
  const parsed = createGroupSchema.safeParse(req.body);

  if (!parsed.success) {
    const response: ErrorResponse = {
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
    res.status(400).json(response);
    return;
  }

  const now = new Date().toISOString();
  const newGroup: SourceGroup = {
    id: `grp-${nextId++}`,
    name: parsed.data.name,
    platform: parsed.data.platform,
    type: parsed.data.type,
    url: parsed.data.url || "",
    description: parsed.data.description || "",
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };

  _groups.push(newGroup);

  const response: GroupResponse = { group: newGroup };
  res.status(201).json(response);
};

/**
 * PUT /api/groups/:id
 */
export const handleUpdateGroup: RequestHandler = (req, res) => {
  const { id } = req.params;
  const index = _groups.findIndex((g) => g.id === id);

  if (index === -1) {
    const response: ErrorResponse = { error: "Group not found" };
    res.status(404).json(response);
    return;
  }

  const parsed = updateGroupSchema.safeParse(req.body);

  if (!parsed.success) {
    const response: ErrorResponse = {
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
    res.status(400).json(response);
    return;
  }

  const updated: SourceGroup = {
    ..._groups[index],
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  _groups[index] = updated;

  const response: GroupResponse = { group: updated };
  res.json(response);
};

/**
 * DELETE /api/groups/:id
 */
export const handleDeleteGroup: RequestHandler = (req, res) => {
  const { id } = req.params;
  const index = _groups.findIndex((g) => g.id === id);

  if (index === -1) {
    const response: ErrorResponse = { error: "Group not found" };
    res.status(404).json(response);
    return;
  }

  _groups.splice(index, 1);
  res.status(204).send();
};
