import { query, queryOne } from "../db/index";
import type { Template, CreateTemplateRequest, UpdateTemplateRequest } from "@shared/api";

function mapRowToTemplate(row: any): Template {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category,
    content: row.content || "",
    emailSubject: row.email_subject,
    isAttachment: row.is_attachment || false,
    attachmentUrl: row.attachment_url,
    attachmentDetailText: row.attachment_detail_text,
    driveFileId: row.drive_file_id,
    driveFileName: row.drive_file_name,
    driveAttachments: row.drive_attachments || (row.drive_file_id ? [{
      id: row.drive_file_id,
      name: row.drive_file_name || "",
      mimeType: "",
      downloadUrl: ""
    }] : []),
    emailTemplateType: row.email_template_type || "body",
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
}

export async function getAllTemplates(userId: string, category?: string, showDeleted: boolean = false): Promise<Template[]> {
  let sql = "SELECT * FROM templates WHERE user_id = $1";
  const params: any[] = [userId];

  if (showDeleted) {
    sql += " AND deleted_at IS NOT NULL";
  } else {
    sql += " AND deleted_at IS NULL";
  }

  if (category) {
    sql += ` AND category = $${params.length + 1}`;
    params.push(category);
  }

  sql += " ORDER BY created_at DESC";
  const rows = await query(sql, params);
  return rows.map(mapRowToTemplate);
}

export async function getTemplateById(userId: string, id: string): Promise<Template | null> {
  const row = await queryOne("SELECT * FROM templates WHERE user_id = $1 AND id = $2", [userId, id]);
  return row ? mapRowToTemplate(row) : null;
}

export async function createTemplate(userId: string, data: CreateTemplateRequest): Promise<Template> {
  const sql = `
    INSERT INTO templates (
      user_id, name, category, content, email_subject, is_attachment, 
      attachment_url, attachment_detail_text, drive_file_id, drive_file_name, drive_attachments, email_template_type
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;
  const values = [
    userId,
    data.name,
    data.category,
    data.content || "",
    data.emailSubject,
    data.isAttachment || false,
    data.attachmentUrl,
    data.attachmentDetailText,
    data.driveFileId,
    data.driveFileName,
    JSON.stringify(data.driveAttachments || []),
    data.emailTemplateType || "body"
  ];
  const row = await queryOne(sql, values);
  return mapRowToTemplate(row);
}

export async function updateTemplate(userId: string, id: string, data: UpdateTemplateRequest): Promise<Template | null> {
  const fields = Object.keys(data).filter(f => f !== 'id' && f !== 'userId');
  if (fields.length === 0) return getTemplateById(userId, id);

  const setClause = fields.map((f, i) => {
    const snake = f.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    return `${snake} = $${i + 3}`;
  }).join(", ");

  const sql = `UPDATE templates SET ${setClause}, updated_at = NOW() WHERE user_id = $1 AND id = $2 RETURNING *`;
  const values = [
    userId, 
    id, 
    ...fields.map(f => {
      const val = (data as any)[f];
      if (f === "driveAttachments" && val) {
        return JSON.stringify(val);
      }
      return val;
    })
  ];

  const row = await queryOne(sql, values);
  return row ? mapRowToTemplate(row) : null;
}

export async function deleteTemplate(userId: string, id: string): Promise<boolean> {
  const result = await query("UPDATE templates SET deleted_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND id = $2", [userId, id]);
  return true;
}

export async function restoreTemplate(userId: string, id: string): Promise<boolean> {
  const result = await query("UPDATE templates SET deleted_at = NULL, updated_at = NOW() WHERE user_id = $1 AND id = $2", [userId, id]);
  return true;
}

export async function hardDeleteTemplate(userId: string, id: string): Promise<boolean> {
  const result = await query("DELETE FROM templates WHERE user_id = $1 AND id = $2", [userId, id]);
  return true;
}
