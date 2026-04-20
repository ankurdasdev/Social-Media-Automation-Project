import { RequestHandler } from "express";
import { query, queryOne } from "../db/index";
import { getDriveClient } from "./google-auth";

// ── GET /api/drive/files?userId=&q=searchTerm ────────────────────────────────
// Search files in the user's configured Drive folder
export const handleSearchDriveFiles: RequestHandler = async (req, res) => {
  const { userId, q = "" } = req.query as Record<string, string>;

  if (!userId) {
    return res.status(401).json({ error: "Not connected to Google Drive" });
  }

  try {
    const tokenRow = await queryOne<{
      drive_folder_id: string;
      drive_folder_name: string;
    }>(
      "SELECT drive_folder_id, drive_folder_name FROM google_tokens WHERE user_id = $1",
      [userId]
    );

    if (!tokenRow) {
      return res.status(401).json({ error: "Not connected to Google Drive" });
    }

    const drive = await getDriveClient(userId);

    // Build query — search globally
    let driveQuery = `trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
    if (q.trim()) {
      driveQuery += ` and name contains '${q.replace(/'/g, "\\'")}'`;
    }

    const response = await drive.files.list({
      q: driveQuery,
      fields: "files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink)",
      pageSize: 30,
      orderBy: "modifiedTime desc",
    });

    const files = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size,
      webViewLink: f.webViewLink,
      iconLink: f.iconLink,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
    }));

    res.json({ files, folderName: tokenRow?.drive_folder_name || null });
  } catch (err: any) {
    console.error("Drive search error:", err.message);
    if (err.message?.includes("not connected") || err.message?.includes("User not connected")) {
      return res.status(401).json({ error: "Not connected to Google Drive" });
    }
    res.status(500).json({ error: "Drive search failed", detail: err.message });
  }
};

// ── GET /api/drive/folders?userId= ──────────────────────────────────────────
// List top-level folders in the user's Drive to let them pick one
export const handleListDriveFolders: RequestHandler = async (req, res) => {
  const { userId } = req.query as Record<string, string>;

  try {
    const drive = await getDriveClient(userId);
    const response = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents",
      fields: "files(id, name)",
      pageSize: 50,
      orderBy: "name",
    });

    res.json({ folders: response.data.files || [] });
  } catch (err: any) {
    console.error("Drive folders error:", err);
    res.status(500).json({ error: "Could not list Drive folders" });
  }
};
