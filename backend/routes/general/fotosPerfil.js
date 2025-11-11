// routes/general/fotosPerfil.js
// Router unificado para foto de perfil (alumno | maestro | administrador | admin_principal)
// Endpoints:
//   - POST /api/perfil/upload/subir              (FormData: "fotoPerfil")
//   - GET  /api/perfil/upload/ultima/:alumnoId   (legacy alumnos)
//   - GET  /api/perfil/upload/me                 (foto actual del usuario autenticado)

const express = require("express");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Middleware de subida (guarda en TMP; aquí movemos al destino final)
const upload = require("../../middlewares/general/fotosPerfil");

// Modelos
const UserAlumno = require("../../models/User_alumno"); // para sincronía legacy opcional
const FotoPerfil = require("../../models_perfil/fotoPerfilModel");

// Cookies por rol (nombres centralizados)
const { COOKIE_NAMES } = require("../../utils/authCookies");

// Rutas físicas base (centralizadas)
const { UPLOADS_ROOT, PERFILES_DIR } = require("../../config/uploadsPath");

const router = express.Router();

/* =========================
   Setup & Utilidades
========================= */

// Asegura que exista la carpeta base /perfiles
fs.mkdirSync(PERFILES_DIR, { recursive: true });

// Roles válidos permitidos
const ROLES_VALIDOS = new Set(["alumno", "maestro", "administrador", "admin_principal"]);

// Sincroniza índices del modelo al levantar (no rompe si ya existen)
(async () => {
  try {
    await FotoPerfil.ensureIndexesSafe();
    console.log("[fotosPerfil] Índices sincronizados con el esquema.");
  } catch (e) {
    console.log("[fotosPerfil] Aviso: no se pudo sincronizar índices:", e?.message || e);
  }
})();

// Borrar por storagePath relativo a UPLOADS_ROOT
async function tryDeleteByStoragePath(storagePath) {
  if (!storagePath) return;
  try {
    const abs = path.join(UPLOADS_ROOT, storagePath.replace(/^[/\\]+/, ""));
    if (fs.existsSync(abs)) {
      await fsp.unlink(abs);
      console.log("🧽 Borrado archivo previo (storagePath):", abs);
    }
  } catch (e) {
    console.log("⚠️ tryDeleteByStoragePath error:", e?.message || e);
  }
}

// Borrar por URL pública (/uploads/...)
async function tryDeleteByUrlPublic(relativeUrl) {
  if (!relativeUrl) return;
  try {
    const clean = relativeUrl.replace(/^\//, ""); // 'uploads/perfiles/...'
    const abs = path.join(UPLOADS_ROOT, clean.replace(/^uploads[\\/]/, ""));
    if (fs.existsSync(abs)) {
      await fsp.unlink(abs);
      console.log("🧽 Borrado archivo previo (url):", abs);
    }
  } catch (e) {
    console.log("⚠️ tryDeleteByUrlPublic error:", e?.message || e);
  }
}

// Detectar extensión conveniente a partir del mimetype
function extFromMime(file) {
  const mt = (file?.mimetype || "").toLowerCase();
  if (mt.includes("jpeg") || mt.includes("jpg")) return ".jpg";
  if (mt.includes("png")) return ".png";
  if (mt.includes("webp")) return ".webp";
  // fallback: respeta el original o usa .jpg
  return (path.extname(file?.originalname) || ".jpg").toLowerCase();
}

/* ============================================================
   🔐 Resolver contexto de autenticación (ACTUALIZADO)
   - Usa req.user si ya viene poblado por algún middleware
   - Si no, acepta:
       • cookie genérica: token
       • cookies por rol (COOKIE_NAMES): token_alumno | token_maestro | token_administrador | token_admin_principal
       • Authorization: Bearer <jwt>
   - Mantiene compatibilidades y defaults previos
============================================================ */
function resolveAuthContext(req) {
  // Preferimos lo que dejó el middleware de auth del subservidor
  let id =
    req.user?._id ||
    req.user?.id ||
    req.usuario?.id ||
    req.alumno?._id ||
    req.alumno?.id ||
    null;

  let role =
    req.user?.role ||
    req.usuario?.role ||
    req.alumno?.role ||
    null;

  // Helper para verificar un JWT con el secreto de la app
  const tryDecode = (token) => {
    if (!token) return null;
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return null;
    }
  };

  // 1) Cookie genérica 'token'
  let decoded = (!id || !role) ? tryDecode(req.cookies?.token) : null;

  // 2) Cookies por rol (si aún falta info). Usamos COOKIE_NAMES centralizados
  if ((!decoded || (!decoded._id && !decoded.userId)) && (!id || !role)) {
    decoded =
      tryDecode(req.cookies?.[COOKIE_NAMES?.alumno]) ||
      tryDecode(req.cookies?.[COOKIE_NAMES?.maestro]) ||
      tryDecode(req.cookies?.[COOKIE_NAMES?.administrador]) ||
      tryDecode(req.cookies?.[COOKIE_NAMES?.admin_principal]) ||
      null;
  }

  // 3) Header Authorization: Bearer <jwt> (fallback)
  if ((!decoded || (!decoded._id && !decoded.userId)) && (!id || !role)) {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    const m = /^Bearer\s+(.+)$/i.exec(String(auth || ""));
    if (m) decoded = tryDecode(m[1]);
  }

  if (decoded) {
    id   = id   || decoded._id || decoded.userId || decoded.id || null;
    role = role || decoded.role || null;
  }

  // Compatibilidad muy legacy: si no hay role, asumimos "alumno"
  if (!role) role = "alumno";

  // Validación de rol
  if (!ROLES_VALIDOS.has(role)) role = "alumno";

  // tenant aún no se usa → "default"
  const tenantId = "default";

  return {
    ownerId: id ? String(id) : null,
    role,
    tenantId,
  };
}

// Construye carpetas/nombres destino y URLs
function buildPaths({ tenantId, role, ownerId, ext }) {
  // Estructura preparada para multi-tenant
  const baseDir = path.join(PERFILES_DIR, tenantId, role, ownerId);
  fs.mkdirSync(baseDir, { recursive: true });

  // Nombre exclusivo por timestamp → evita colisiones y ayuda contra caché
  const filename = `${Date.now()}${ext}`;
  const absPath = path.join(baseDir, filename);

  // storagePath relativo a UPLOADS_ROOT
  // PERFILES_DIR suele ser `${UPLOADS_ROOT}/perfiles`
  const storagePath = path.relative(UPLOADS_ROOT, absPath).replace(/\\/g, "/"); // p.ej. 'perfiles/default/alumno/<ownerId>/12345.jpg'

  // URL pública
  const urlPublica = `/uploads/${storagePath}`.replace(/\\/g, "/");

  return { absPath, storagePath, urlPublica };
}

// Logs al levantar el router
console.log("─".repeat(70));
console.log("[fotosPerfil] UPLOADS_ROOT:", UPLOADS_ROOT);
console.log("[fotosPerfil] PERFILES_DIR:", PERFILES_DIR);
console.log("─".repeat(70));

/* =========================
   Endpoints
========================= */

/**
 * GET /api/perfil/upload/me
 * Devuelve { url } de la foto actual del usuario autenticado
 */
router.get("/me", async (req, res) => {
  try {
    const { ownerId, role, tenantId } = resolveAuthContext(req);
    if (!ownerId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Busca la foto “actual”
    let doc = await FotoPerfil.findOne({
      tenantId,
      role,
      ownerId,
      isCurrent: true,
    }).lean();

    // Compatibilidad: si no hay doc nuevo y es alumno, intenta legacy
    if (!doc && role === "alumno") {
      doc = await FotoPerfil.findOne({ alumnoId: ownerId }).lean();
      if (!doc?.url) {
        const user = await UserAlumno.findById(ownerId).select("fotoPerfilUrl").lean();
        if (user?.fotoPerfilUrl) return res.json({ url: user.fotoPerfilUrl });
      }
    }

    return res.json({ url: doc?.url || null });
  } catch (e) {
    console.error("❌ GET /me error:", e);
    return res.status(500).json({ error: "No se pudo leer la foto." });
  }
});

/**
 * GET /api/perfil/upload/ultima/:alumnoId
 * (Legacy) Devuelve { url } buscando en fotoperfiles; si no hay, cae a UserAlumno.fotoPerfilUrl
 */
router.get("/ultima/:alumnoId", async (req, res) => {
  try {
    const { alumnoId } = req.params;

    // Primero, intenta nuevo esquema (ownerId/role=alumno)
    let doc = await FotoPerfil.findOne({
      ownerId: alumnoId,
      role: "alumno",
      isCurrent: true,
    }).lean();

    if (doc?.url) {
      console.log(`📤 GET /ultima origen=newSchema alumno=${alumnoId} url=${doc.url}`);
      return res.json({ url: doc.url });
    }

    // Luego, intenta legacy en la misma colección
    doc = await FotoPerfil.findOne({ alumnoId }).lean();
    if (doc?.url) {
      console.log(`📤 GET /ultima origen=fotoperfiles (legacy) alumno=${alumnoId} url=${doc.url}`);
      return res.json({ url: doc.url });
    }

    // Por último, campo embebido en UserAlumno
    const user = await UserAlumno.findById(alumnoId).select("fotoPerfilUrl").lean();
    const fallback = user?.fotoPerfilUrl || null;
    console.log(`📤 GET /ultima origen=${fallback ? "UserAlumno" : "none"} alumno=${alumnoId} url=${fallback}`);
    return res.json({ url: fallback });
  } catch (e) {
    console.error("❌ /ultima error:", e);
    return res.status(500).json({ error: "No se pudo leer la foto." });
  }
});

/**
 * POST /api/perfil/upload/subir
 * Campo de archivo: 'fotoPerfil'
 * Body opcional (LEGACY): { alumnoId } -> ya no necesario si hay JWT
 */
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

      // Compatibilidad muy legacy: si no hay ownerId en token, toma del body como 'alumnoId'
      let finalOwnerId = ownerId;
      if (!finalOwnerId && req.body?.alumnoId) finalOwnerId = String(req.body.alumnoId);

      if (!finalOwnerId) {
        console.log("🟥 motivo 400: falta ownerId");
        return res.status(400).json({ error: "Falta ownerId (token o body.legacy alumnoId)." });
      }

      if (!req.file || !req.file.path || req.file.size === 0) {
        console.log("🟥 motivo 400: no llegó archivo 'fotoPerfil'");
        return res.status(400).json({ error: "No se recibió archivo 'fotoPerfil'." });
      }

      // Prepara extensión y rutas de destino
      const ext = extFromMime(req.file);
      const { absPath, storagePath, urlPublica } = buildPaths({
        tenantId,
        role,
        ownerId: finalOwnerId,
        ext,
      });

      console.log("📥 tmp recibido:", req.file.path);
      console.log("➡️  destinoFinal:", absPath);

      // Mover desde TMP al destino final
      await fsp.rename(req.file.path, absPath);

      // Recoger TODAS las fotos previas (nuevo esquema + legacy), cubriendo ownerId string y ObjectId
      let oid = null;
      try { oid = new mongoose.Types.ObjectId(finalOwnerId); } catch (_) { /* noop */ }

      const prevDocs = await FotoPerfil.find({
        $or: [
          { tenantId, role, ownerId: finalOwnerId }, // nuevo (string id guardado)
          ...(oid ? [{ tenantId, role, ownerId: oid }] : []), // por si hay docs guardados con ObjectId
          ...(role === "alumno" && oid ? [{ alumnoId: oid }] : []), // legacy alumnoId
        ],
      }).lean();

      // Desactivar la "actual" para evitar colisión con el índice parcial (cubriendo ambos tipos)
      await FotoPerfil.updateMany(
        {
          tenantId,
          role,
          isCurrent: true,
          $or: [
            { ownerId: finalOwnerId }, // string
            ...(oid ? [{ ownerId: oid }] : []), // ObjectId
          ],
        },
        { $set: { isCurrent: false } }
      );

      // Crear el nuevo registro como “actual”
      const doc = await FotoPerfil.create({
        ownerId: finalOwnerId,
        role,
        tenantId,
        url: urlPublica,
        storagePath,         // para borrado seguro
        mime: req.file.mimetype || null,
        size: req.file.size || null,
        isCurrent: true,
        fechaSubida: new Date(),
        // Legacy fields (solo si es alumno)
        ...(role === "alumno" ? { alumnoId: oid || finalOwnerId } : {}),
      });

      console.log("📚 fotoperfiles insert OK:", {
        ownerId: finalOwnerId,
        role,
        tenantId,
        url: urlPublica,
      });

      // Borrar archivos previos (nuevo y legacy), excepto el recién creado
      for (const p of prevDocs) {
        // Evitar borrar el mismo archivo recién creado
        if (p.storagePath && p.storagePath === storagePath) continue;
        if (p.url && p.url === urlPublica) continue;

        if (p.storagePath) {
          await tryDeleteByStoragePath(p.storagePath);
        } else if (p.url) {
          await tryDeleteByUrlPublic(p.url);
        }
      }

      // Sincronía legacy: si es alumno, actualiza UserAlumno.fotoPerfilUrl
      if (role === "alumno") {
        await UserAlumno.findByIdAndUpdate(finalOwnerId, { fotoPerfilUrl: urlPublica }).lean();
      }

      console.log("✅ subida OK →", urlPublica);
      // Tip: en el front, usa esta URL o añade ?v=Date.now() para evitar caché
      return res.json({ ok: true, url: urlPublica, meta: { mime: doc.mime, size: doc.size } });
    } catch (e) {
      console.error("❌ /subir error:", e);

      // Limpieza si falla (borra tmp)
      try {
        if (req.file?.path && fs.existsSync(req.file.path)) await fsp.unlink(req.file.path);
      } catch (_) {}

      // Señaliza causa común: índice único legacy
      if (String(e?.code) === "11000" || /E11000/.test(String(e?.message || ""))) {
        return res.status(409).json({ error: "Conflicto de índice único (verifica índices en 'fotoperfiles')." });
      }
      return res.status(500).json({ error: "No se pudo subir la foto." });
    }
  }
);

module.exports = router;







