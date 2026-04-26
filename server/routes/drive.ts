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

    // Ensure we only search within the specific folder they linked (massive speedup)
    let driveQuery = `trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
    if (tokenRow.drive_folder_id) {
      driveQuery += ` and '${tokenRow.drive_folder_id}' in parents`;
    }

    const trimmed = q.trim().toLowerCase();
    if (trimmed) {
      // Escape single quotes in search term for Google Drive query
      const safe = trimmed.replace(/'/g, "\\'");
      // Use name contains for initial filtering (Drive API is prefix-based, but helps narrow huge folders)
      driveQuery += ` and name contains '${safe}'`;
    }

    const response = await drive.files.list({
      q: driveQuery,
      fields: "files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink)",
      pageSize: trimmed ? 100 : 50, // Grab more if searching to allow better partial filtering
      orderBy: "modifiedTime desc",
    });

    let files = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size,
      webViewLink: f.webViewLink,
      iconLink: f.iconLink,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
    }));

    // If no results from strict API search, and a search term exists, try fetching recent files 
    // and evaluating pure partial substring matches in-memory to catch what Google Drive misses
    if (trimmed && files.length === 0) {
      let fallbackQuery = `trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
      if (tokenRow.drive_folder_id) fallbackQuery += ` and '${tokenRow.drive_folder_id}' in parents`;

      const fallbackResponse = await drive.files.list({
        // Only get files without 'contains' constraint
        q: fallbackQuery,
        fields: "files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink)",
        pageSize: tokenRow.drive_folder_id ? 500 : 200, // Fetch up to 500 in folder, or 200 globally
        orderBy: "modifiedTime desc",
      });
      const fallbackFiles = fallbackResponse.data.files || [];
      // Do pure JS substring matching
      const mapped = fallbackFiles
        .filter(f => f.name && f.name.toLowerCase().includes(trimmed))
        .map(f => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          webViewLink: f.webViewLink,
          iconLink: f.iconLink,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
        }));
      files = mapped;
    }

    res.json({ files, folderName: tokenRow?.drive_folder_name || null });
  } catch (err: any) {
    console.error("Drive search error:", err.message);
    if (err.message?.includes("not connected") || err.message?.includes("User not connected") || err.message?.includes("invalid_grant")) {
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
