import { RequestHandler } from "express";
import { z } from "zod";
import { query, queryOne } from "../db/index";
import axios from "axios";
import { getAccountPosts } from "../services/instagram-client";
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
    isManual: row.is_manual,
    lastVerifiedAt: row.last_verified_at?.toISOString(),
    status: row.status || "pending",
    statusMessage: row.status_message || "",
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
  status: z.enum(["connected", "failed", "pending", "error"]).optional().default("pending"),
});

const updateGroupSchema = z.object({
  userId: z.string().uuid("Invalid User ID"),
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["group", "account", "hashtag", "channel"]).optional(),
  url: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  enabled: z.boolean().optional(),
  status: z.enum(["connected", "failed", "pending", "error"]).optional(),
  statusMessage: z.string().max(1000).optional(),
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

  const { userId, name, platform, type, url, description, status } = parsed.data;

  try {
    // 1. Create the source group immediately with requested status (default pending)
    const row = await queryOne(
      `INSERT INTO source_groups (user_id, name, platform, type, url, description, status, is_manual) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [userId, name, platform, type, url, description, status]
    );

    const group = mapRowToGroup(row);
    
    // 2. Return success immediately
    res.status(201).json({ group });

    // 3. Initiate verification in the background
    // We don't await this to keep the response fast
    verifySourceInternal(group.id, userId, name, platform, type, url).catch(err => {
      console.error(`[Background Verification Error] Group ${group.id}:`, err);
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create source" });
  }
};

/**
 * Background verification logic
 */
async function verifySourceInternal(
  groupId: string, 
  userId: string, 
  name: string, 
  platform: string, 
  type: string, 
  url: string
) {
  let finalStatus: "connected" | "failed" = "connected";
  let finalMessage = "";
  let finalUrl = url;

  try {
    // Check if verification is actually needed
    const existing = await queryOne(
      "SELECT is_manual, last_verified_at, status FROM source_groups WHERE id = $1",
      [groupId]
    );

    if (existing) {
      const isManual = existing.is_manual;
      const lastVerified = existing.last_verified_at;
      const isConnected = existing.status === "connected";

      // If it's not manual and already connected, skip heavy verification
      if (!isManual && isConnected) {
        return;
      }

      // Throttling: If verified in the last 24 hours and currently connected, skip
      if (isConnected && lastVerified && (Date.now() - new Date(lastVerified).getTime()) < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    if (platform === "whatsapp") {
      const instance = await queryOne<{ instance_name: string }>(
        "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
        [userId]
      );
      
      if (!instance) {
        throw new Error("WhatsApp not connected. Please connect in Settings.");
      }
      
      const evoUrl = process.env.EVOLUTION_API_URL || "https://evo.casthub.io";
      const eApiKey = process.env.EVOLUTION_API_KEY || "";
      const { data: waGroups } = await axios.get(`${evoUrl}/group/fetchAllGroups/${instance.instance_name}?getParticipants=false`, {
        headers: { apikey: eApiKey },
        validateStatus: () => true
      });

      if (!Array.isArray(waGroups)) {
        throw new Error("Failed to fetch groups from WhatsApp API.");
      }

      const foundGroup = waGroups.find((g: any) => g.subject === name);
      if (!foundGroup) {
        throw new Error(`WhatsApp group "${name}" not found on your connected account.`);
      }
      finalUrl = url || foundGroup.id;
    } else if (platform === "instagram") {
      const sessionRow = await queryOne("SELECT session_data FROM instagram_sessions WHERE user_id = $1", [userId]);
      if (!sessionRow) {
         throw new Error("Instagram not connected. Please connect in Settings.");
      }
      
      if (type === "account") {
        const posts = await getAccountPosts(name, 0, sessionRow.session_data).catch(() => []);
        if (posts.length === 0) {
           throw new Error(`Instagram account "${name}" could not be verified or is private.`);
        }
      }
    }

    // Success update
    await query(
      "UPDATE source_groups SET status = $1, status_message = $2, url = $3, last_verified_at = NOW(), updated_at = NOW() WHERE id = $4",
      ["connected", "", finalUrl, groupId]
    );

  } catch (err: any) {
    // Failure update
    await query(
      "UPDATE source_groups SET status = $1, status_message = $2, last_verified_at = NOW(), updated_at = NOW() WHERE id = $3",
      ["failed", err.message || "Verification failed", groupId]
    );
  }
}

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
  const needsReverification = fields.includes("name") || fields.includes("type");

  if (needsReverification) {
    (data as any).status = "pending";
    (data as any).status_message = "";
    fields.push("status", "status_message");
  }

  if (fields.length === 0) {
    const row = await queryOne("SELECT * FROM source_groups WHERE user_id = $1 AND id = $2", [userId, id]);
    if (!row) return res.status(404).json({ error: "Group not found" });
    return res.json({ group: mapRowToGroup(row) });
  }

  const setClause = fields.map((f, i) => {
    // Map statusMessage (camelCase) to status_message (snake_case)
    const dbField = f === "statusMessage" ? "status_message" : f;
    return `${dbField} = $${i + 3}`;
  }).join(", ");

  const sql = `UPDATE source_groups SET ${setClause}, updated_at = NOW() WHERE user_id = $1 AND id = $2 RETURNING *`;
  const values = [userId, id, ...fields.map((f) => (data as any)[f])];

  try {
    const row = await queryOne(sql, values);
    if (!row) return res.status(404).json({ error: "Group not found" });
    
    const group = mapRowToGroup(row);
    res.json({ group });

    if (needsReverification) {
      verifySourceInternal(
        group.id, 
        userId, 
        group.name, 
        group.platform, 
        group.type, 
        group.url || ""
      ).catch(err => {
        console.error(`[Background Re-Verification Error] Group ${group.id}:`, err);
      });
    }
  } catch (err: any) {
    console.error("Update group error:", err);
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
