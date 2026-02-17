import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { initDb } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

await initDb();

// Security / parsing
app.use(helmet({
  contentSecurityPolicy: false // keep simple for static site + Chart.js CDN
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// API
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);

// Static site
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// SPA-ish: serve index for unknown routes if needed (we use multiple html pages, so only fallback when missing)
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
