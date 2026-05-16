import { RequestHandler } from "express";
import { query, queryOne } from "../db/index";

export const handleGetSalutations: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  
  const rows = await query("SELECT text FROM salutations WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  res.json({ salutations: rows.map(r => r.text) });
};

export const handleAddSalutation: RequestHandler = async (req, res) => {
  const { userId, text } = req.body;
  if (!userId || !text) return res.status(400).json({ error: "Missing userId or text" });
  
  // Check if it already exists
  const exists = await queryOne("SELECT id FROM salutations WHERE user_id = $1 AND text = $2", [userId, text]);
  if (!exists) {
    await query("INSERT INTO salutations (user_id, text) VALUES ($1, $2)", [userId, text]);
  }
  
  res.json({ success: true });
};
