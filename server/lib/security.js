import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export function signToken(payload) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  return jwt.verify(token, secret);
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.auth || (req.headers.authorization || "").replace("Bearer ","");
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid session" });
  }
}
