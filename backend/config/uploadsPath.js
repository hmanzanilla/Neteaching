//backend/config/uploadsPath.js
// backend/config/uploadsPath.js
// Rutas centralizadas para subidas (evita ambigüedad según dónde arranque Node)
const path = require("path");
const fs = require("fs");

// Valor desde .env (puede ser absoluto o relativo)
const ENV_DIR = process.env.UPLOADS_DIR;

// Directorio por defecto: <repo>/backend/uploads
const DEFAULT_DIR = path.resolve(__dirname, "..", "uploads");

// Si ENV_DIR es absoluta, úsala tal cual. Si es relativa, resuélvela desde backend/.
const UPLOADS_ROOT = ENV_DIR
  ? (path.isAbsolute(ENV_DIR) ? ENV_DIR : path.resolve(__dirname, "..", ENV_DIR))
  : DEFAULT_DIR;

// Subcarpetas
const TMP_DIR = path.join(UPLOADS_ROOT, "_tmp");
const PERFILES_DIR = path.join(UPLOADS_ROOT, "perfiles");

// Crea carpetas (idempotente)
[UPLOADS_ROOT, TMP_DIR, PERFILES_DIR].forEach((p) => {
  try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
});

// Logs de diagnóstico al cargar el módulo (útiles para ver rutas reales en runtime)
console.log("════════ uploadsPath ═════════════════════");
console.log("UPLOADS_ROOT  →", UPLOADS_ROOT);
console.log("TMP_DIR       →", TMP_DIR);
console.log("PERFILES_DIR  →", PERFILES_DIR);
console.log("══════════════════════════════════════════");

module.exports = { UPLOADS_ROOT, TMP_DIR, PERFILES_DIR };

