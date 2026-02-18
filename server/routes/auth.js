import express from "express";
import crypto from "crypto";
import { run, get } from "../lib/db.js";
import { hashPassword, verifyPassword, signToken } from "../lib/security.js";
import { sendResetEmail } from "../lib/mailer.js";

export const authRouter = express.Router();

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return typeof pw === "string" && pw.length >= 8 && /[0-9]/.test(pw);
}

// Register
authRouter.post("/register", async (req, res) => {
  try{
    const { firstName, lastName, address, postal, phone, email, password } = req.body || {};
    if(!firstName || !lastName || !address || !postal || !phone || !email || !password){
      return res.status(400).json({ error: "Missing fields" });
    }
    if(!validEmail(email)) return res.status(400).json({ error: "Invalid email" });
    if(!validatePassword(password)) return res.status(400).json({ error: "Weak password" });

    const existing = await get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if(existing) return res.status(409).json({ error: "Email already used" });

    const passwordHash = await hashPassword(password);
    const createdAt = new Date().toISOString();

    const r = await run(
      "INSERT INTO users (first_name,last_name,address,postal,phone,email,password_hash,created_at) VALUES (?,?,?,?,?,?,?,?)",
      [firstName.trim(), lastName.trim(), address.trim(), postal.trim(), phone.trim(), email.toLowerCase().trim(), passwordHash, createdAt]
    );

    const token = signToken({ uid: r.lastID, email: email.toLowerCase().trim() });
    res.cookie("auth", token, { httpOnly: true, sameSite: "lax", secure: false });
    return res.json({ ok: true });
  } catch(e){
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login
authRouter.post("/login", async (req, res) => {
  try{
    const { email, password } = req.body || {};
    if(!email || !password) return res.status(400).json({ error: "Missing fields" });
    const user = await get("SELECT id, email, password_hash FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if(!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await verifyPassword(password, user.password_hash);
    if(!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ uid: user.id, email: user.email });
    res.cookie("auth", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: true,
  path: "/"
});
    return res.json({ ok: true });
  } catch(e){
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Logout
authRouter.post("/logout", async (req, res) => {
  res.clearCookie("auth", { path: "/" });
  return res.json({ ok: true });
});

// Request password reset
authRouter.post("/password-reset/request", async (req, res) => {
  try{
    const { email } = req.body || {};
    if(!email) return res.status(400).json({ error: "Missing email" });

    const user = await get("SELECT id, email FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    // Do not reveal whether user exists
    if(!user) return res.json({ ok: true });

    const token = crypto.randomBytes(24).toString("hex"); // raw token (send)
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex"); // store
    const expiresAt = new Date(Date.now() + 60*60*1000).toISOString(); // 1h
    const createdAt = new Date().toISOString();

    await run(
      "INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (?,?,?,?)",
      [user.id, tokenHash, expiresAt, createdAt]
    );

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const link = `${baseUrl}/reset-password.html?token=${token}&email=${encodeURIComponent(user.email)}`;
    await sendResetEmail({ to: user.email, link });

    return res.json({ ok: true });
  } catch(e){
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Confirm reset
authRouter.post("/password-reset/confirm", async (req, res) => {
  try{
    const { email, token, newPassword } = req.body || {};
    if(!email || !token || !newPassword) return res.status(400).json({ error: "Missing fields" });
    if(!validatePassword(newPassword)) return res.status(400).json({ error: "Weak password" });

    const user = await get("SELECT id, email FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if(!user) return res.status(400).json({ error: "Invalid request" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const row = await get(
      "SELECT id, expires_at, used_at FROM password_resets WHERE user_id = ? AND token_hash = ? ORDER BY id DESC LIMIT 1",
      [user.id, tokenHash]
    );
    if(!row) return res.status(400).json({ error: "Invalid token" });
    if(row.used_at) return res.status(400).json({ error: "Token already used" });
    if(new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Token expired" });

    const pwHash = await hashPassword(newPassword);
    await run("UPDATE users SET password_hash = ? WHERE id = ?", [pwHash, user.id]);
    await run("UPDATE password_resets SET used_at = ? WHERE id = ?", [new Date().toISOString(), row.id]);

    return res.json({ ok: true });
  } catch(e){
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});
