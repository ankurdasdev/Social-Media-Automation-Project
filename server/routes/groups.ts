import { RequestHandler } from "express";
import { z } from "zod";
import { query, queryOne } from "../db/index";
import type {
  SourceGroup,
  GroupsResponse,
  GroupResponse,
  ErrorResponse,
} from "@shared/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRowToGroup(row: any): SourceGroup {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    type: row.type,
    url: row.url || "",
    description: row.description || "",
    enabled: row.enabled,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
}

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createGroupSchema = z.object({
  userId: z.string().uuid("Invalid User ID"),
  name: z.string().min(1, "Name is required").max(200),
  platform: z.enum(["whatsapp", "instagram"]),
  type: z.enum(["group", "account", "hashtag", "channel"]),
  url: z.string().max(500).optional().default(""),
  description: z.string().max(1000).optional().default(""),
});

const updateGroupSchema = z.object({
  userId: z.string().uuid("Invalid User ID"),
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["group", "account", "hashtag", "channel"]).optional(),
  url: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  enabled: z.boolean().optional(),
});

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * GET /api/groups
 */
export const handleGetGroups: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  let sql = "SELECT * FROM source_groups WHERE user_id = $1";
  const params: any[] = [userId];

  const platform = req.query.platform as string | undefined;
  if (platform && (platform === "whatsapp" || platform === "instagram")) {
    sql += " AND platform = $2";
    params.push(platform);
  }

  const search = req.query.search as string | undefined;
  if (search) {
    sql += ` AND (LOWER(name) LIKE LOWER($${params.length + 1}) OR LOWER(description) LIKE LOWER($${params.length + 1}))`;
    params.push(`%${search}%`);
  }

  sql += " ORDER BY created_at DESC";

  try {
    const rows = await query(sql, params);
    const groups = rows.map(mapRowToGroup);
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

/**
 * POST /api/groups
 */
export const handleCreateGroup: RequestHandler = async (req, res) => {
  const parsed = createGroupSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors.map((e) => e.message).join(", ") });
    return;
  }

  const { userId, name, platform, type, url, description } = parsed.data;

  try {
    const row = await queryOne(
      `INSERT INTO source_groups (user_id, name, platform, type, url, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, platform, type, url, description]
    );
    res.status(201).json({ group: mapRowToGroup(row) });
  } catch (err) {
    res.status(500).json({ error: "Failed to create group" });
  }
};

/**
 * PUT /api/groups/:id
 */
export const handleUpdateGroup: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const parsed = updateGroupSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors.map((e) => e.message).join(", ") });
    return;
  }

  const { userId, ...data } = parsed.data;
  const fields = Object.keys(data);
  if (fields.length === 0) {
    const row = await queryOne("SELECT * FROM source_groups WHERE user_id = $1 AND id = $2", [userId, id]);
    if (!row) return res.status(404).json({ error: "Group not found" });
    return res.json({ group: mapRowToGroup(row) });
  }

  const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(", ");
  const sql = `UPDATE source_groups SET ${setClause}, updated_at = NOW() WHERE user_id = $1 AND id = $2 RETURNING *`;
  const values = [userId, id, ...fields.map((f) => (data as any)[f])];

  try {
    const row = await queryOne(sql, values);
    if (!row) return res.status(404).json({ error: "Group not found" });
    res.json({ group: mapRowToGroup(row) });
  } catch (err) {
    res.status(500).json({ error: "Failed to update group" });
  }
};

/**
 * DELETE /api/groups/:id
 */
export const handleDeleteGroup: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const result = await query("DELETE FROM source_groups WHERE user_id = $1 AND id = $2", [userId, id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete group" });
  }
};
