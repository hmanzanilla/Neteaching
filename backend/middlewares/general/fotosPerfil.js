// backend/middlewares/general/fotosPerfil.js
// Middleware de subida para foto de perfil (multer)
// - Deja el archivo en un TMP local dentro de UPLOADS_ROOT para evitar EXDEV (C:↔D:)
// - Acepta solo imágenes (jpeg/png/webp)
// - Limita tamaño (configurable por env)

const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Usa la misma raíz física que el server sirve en /uploads
const { UPLOADS_ROOT } = require("../../config/uploadsPath");

// Carpeta TMP *dentro* de UPLOADS_ROOT → evita EXDEV en Windows/Docker
const TMP_DIR =
  process.env.UPLOADS_TMP_DIR &&
  path.isAbsolute(process.env.UPLOADS_TMP_DIR)
    ? process.env.UPLOADS_TMP_DIR
    : path.join(UPLOADS_ROOT, "_tmp");

fs.mkdirSync(TMP_DIR, { recursive: true });

// Tamaño máximo por defecto: 5 MB (configurable)
const MAX_MB = Number(process.env.MAX_PROFILE_PIC_MB || 5);
const MAX_BYTES = Math.max(1, MAX_MB) * 1024 * 1024;

// Sanitiza nombre básico (solo para TMP; el nombre definitivo lo pone el router)
function safeBaseName(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.-]/g, "");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => {
    const orig = safeBaseName(file.originalname || "upload");
    const ext = path.extname(orig) || ".jpg";
    const stamp = Date.now().toString();
    // tmp_<timestamp>_<rand><ext>
    cb(null, `tmp_${stamp}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const mt = (file.mimetype || "").toLowerCase();
  const ok =
    mt.includes("jpeg") ||
    mt.includes("jpg") ||
    mt.includes("png") ||
    mt.includes("webp");
  if (!ok) {
    return cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Solo se permiten imágenes jpg, png o webp."
      )
    );
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_BYTES,
    files: 1,
  },
});

module.exports = upload;


