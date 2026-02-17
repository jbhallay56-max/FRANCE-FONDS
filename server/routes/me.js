import express from "express";
import { requireAuth } from "../lib/security.js";
import { get } from "../lib/db.js";

export const meRouter = express.Router();

meRouter.get("/", requireAuth, async (req, res) => {
  const uid = req.user.uid;
  const user = await get("SELECT id, first_name, last_name, email, address, postal, phone, created_at FROM users WHERE id = ?", [uid]);
  if(!user) return res.status(404).json({ error: "Not found" });
  return res.json({ user });
});
