// routes/general/fotosPerfil.js
const express = require("express");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const upload = require("../../middlewares/general/fotosPerfil");
const UserAlumno = require("../../models/User_alumno");
const FotoPerfil = require("../../models_perfil/fotoPerfilModel");
const { UPLOADS_ROOT, PERFILES_DIR } = require("../../config/uploadsPath");

const router = express.Router();

/* Utils */
fs.mkdirSync(PERFILES_DIR, { recursive: true });
const ROLES_VALIDOS = new Set(["alumno", "maestro", "administrador", "admin_principal"]);

async function tryDeleteByStoragePath(storagePath) {
  if (!storagePath) return;
  try {
    const abs = path.join(UPLOADS_ROOT, storagePath.replace(/^[/\\]+/, ""));
    if (fs.existsSync(abs)) await fsp.unlink(abs);
  } catch (e) { console.log("tryDeleteByStoragePath error:", e?.message || e); }
}
async function tryDeleteByUrlPublic(relativeUrl) {
  if (!relativeUrl) return;
  try {
    const clean = relativeUrl.replace(/^\//, "");
    const abs = path.join(UPLOADS_ROOT, clean.replace(/^uploads[\\/]/, ""));
    if (fs.existsSync(abs)) await fsp.unlink(abs);
  } catch (e) { console.log("tryDeleteByUrlPublic error:", e?.message || e); }
}
function extFromMime(file) {
  const mt = (file?.mimetype || "").toLowerCase();
  if (mt.includes("jpeg") || mt.includes("jpg")) return ".jpg";
  if (mt.includes("png")) return ".png";
  if (mt.includes("webp")) return ".webp";
  return (path.extname(file?.originalname) || ".jpg").toLowerCase();
}
function resolveAuthContext(req) {
  let id =
    req.user?._id || req.user?.id || req.usuario?.id || req.alumno?._id || req.alumno?.id || null;
  let role = req.user?.role || req.usuario?.role || req.alumno?.role || null;

  if ((!id || !role) && req.cookies?.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      id = id || decoded._id || decoded.userId || decoded.id || null;
      role = role || decoded.role || null;
    } catch {}
  }
  if (!role || !ROLES_VALIDOS.has(role)) role = "alumno";
  const tenantId = "default";
  return { ownerId: id ? String(id) : null, role, tenantId };
}
function buildPaths({ tenantId, role, ownerId, ext }) {
  const baseDir = path.join(PERFILES_DIR, tenantId, role, ownerId);
  fs.mkdirSync(baseDir, { recursive: true });
  const filename = `${Date.now()}${ext}`;
  const absPath = path.join(baseDir, filename);
  const storagePath = path
    .relative(UPLOADS_ROOT, absPath)
    .replace(/\\/g, "/");
  const urlPublica = `/uploads/${storagePath}`.replace(/\\/g, "/");
  return { absPath, storagePath, urlPublica };
}

console.log("─".repeat(70));
console.log("[fotosPerfil] UPLOADS_ROOT:", UPLOADS_ROOT);
console.log("[fotosPerfil] PERFILES_DIR:", PERFILES_DIR);
console.log("─".repeat(70));

/* GET /me */
router.get("/me", async (req, res) => {
  try {
    const { ownerId, role, tenantId } = resolveAuthContext(req);
    if (!ownerId) return res.status(401).json({ error: "No autenticado" });

    let doc = await FotoPerfil.findOne({ tenantId, role, ownerId, isCurrent: true }).lean();

    if (!doc && role === "alumno") {
      doc = await FotoPerfil.findOne({ alumnoId: ownerId }).lean();
      if (!doc?.url) {
        const user = await UserAlumno.findById(ownerId).select("fotoPerfilUrl").lean();
        if (user?.fotoPerfilUrl) return res.json({ url: user.fotoPerfilUrl });
      }
    }
    return res.json({ url: doc?.url || null });
  } catch (e) {
    console.error("GET /me error:", e);
    return res.status(500).json({ error: "No se pudo leer la foto." });
  }
});

/* GET /ultima/:alumnoId (legacy) */
router.get("/ultima/:alumnoId", async (req, res) => {
  try {
    const { alumnoId } = req.params;

    let doc = await FotoPerfil.findOne({ ownerId: alumnoId, role: "alumno", isCurrent: true }).lean();
    if (doc?.url) return res.json({ url: doc.url });

    doc = await FotoPerfil.findOne({ alumnoId }).lean();
    if (doc?.url) return res.json({ url: doc.url });

    const user = await UserAlumno.findById(alumnoId).select("fotoPerfilUrl").lean();
    return res.json({ url: user?.fotoPerfilUrl || null });
  } catch (e) {
    console.error("/ultima error:", e);
    return res.status(500).json({ error: "No se pudo leer la foto." });
  }
});

/* POST /subir */
router.post(
  "/subir",
  (req, _res, next) => {
    console.log("🟣 [UPLOAD] HIT /subir", new Date().toISOString());
    console.log("🟣 content-type:", req.headers["content-type"]);
    next();
  },
  upload.single("fotoPerfil"),
  async (req, res) => {
    try {
      const { ownerId, role, tenantId } = resolveAuthContext(req);

      let finalOwnerId = ownerId;
      if (!finalOwnerId && req.body?.alumnoId) finalOwnerId = String(req.body.alumnoId);

      if (!finalOwnerId) return res.status(400).json({ error: "Falta ownerId (token o body.legacy alumnoId)." });
      if (!req.file || !req.file.path || req.file.size === 0)
        return res.status(400).json({ error: "No se recibió archivo 'fotoPerfil'." });

      const ext = extFromMime(req.file);
      const { absPath, storagePath, urlPublica } = buildPaths({
        tenantId, role, ownerId: finalOwnerId, ext,
      });

      await fsp.rename(req.file.path, absPath);

      // 👇 clave del arreglo: cubrir ownerId string y ObjectId
      let oid = null;
      try { oid = new mongoose.Types.ObjectId(finalOwnerId); } catch {}

      const prevDocs = await FotoPerfil.find({
        $or: [
          { tenantId, role, ownerId: finalOwnerId },
          ...(oid ? [{ tenantId, role, ownerId: oid }] : []),
          ...(role === "alumno" && oid ? [{ alumnoId: oid }] : []),
        ],
      }).lean();

      // 🔧 FIX: desactiva cualquier “actual” considerando ambos tipos
      await FotoPerfil.updateMany(
        {
          tenantId,
          role,
          isCurrent: true,
          $or: [
            { ownerId: finalOwnerId },
            ...(oid ? [{ ownerId: oid }] : []),
          ],
        },
        { $set: { isCurrent: false } }
      );

      const doc = await FotoPerfil.create({
        ownerId: finalOwnerId,
        role,
        tenantId,
        url: urlPublica,
        storagePath,
        mime: req.file.mimetype || null,
        size: req.file.size || null,
        isCurrent: true,
        fechaSubida: new Date(),
        ...(role === "alumno" ? { alumnoId: oid || finalOwnerId } : {}),
      });

      for (const p of prevDocs) {
        if (p.storagePath === storagePath || p.url === urlPublica) continue;
        if (p.storagePath) await tryDeleteByStoragePath(p.storagePath);
        else if (p.url) await tryDeleteByUrlPublic(p.url);
      }

      if (role === "alumno") {
        await UserAlumno.findByIdAndUpdate(finalOwnerId, { fotoPerfilUrl: urlPublica }).lean();
      }

      return res.json({ ok: true, url: urlPublica, meta: { mime: doc.mime, size: doc.size } });
    } catch (e) {
      console.error("/subir error:", e);
      try { if (req.file?.path && fs.existsSync(req.file.path)) await fsp.unlink(req.file.path); } catch {}
      if (String(e?.code) === "11000" || /E11000/.test(String(e?.message || ""))) {
        return res.status(409).json({ error: "Conflicto de índice único (verifica índices en 'fotoperfiles')." });
      }
      return res.status(500).json({ error: "No se pudo subir la foto." });
    }
  }
);

module.exports = router;