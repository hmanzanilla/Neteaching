// backend/routes/logout.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Modelos por rol
const modelos = {
  alumno:          require("../models/User_alumno"),
  maestro:         require("../models/User_maestro"),
  administrador:   require("../models/User_admin"),
  admin_principal: require("../models/User_admin_principal"),
};

// Utilidades de cookies por rol
const { COOKIE_NAMES, getTokenFromReq } = require("../utils/authCookies");

/**
 * Opciones consistentes con las usadas al setear las cookies.
 * - En localhost normalmente: sameSite:'lax', secure:false, sin domain.
 * - En producción (https) puedes usar sameSite:'none', secure:true y opcionalmente COOKIE_DOMAIN.
 */
function buildClearOpts(req) {
  const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const usingHttps = !!(req.secure || req.headers["x-forwarded-proto"] === "https");

  // Si defines COOKIE_DOMAIN=.tudominio.com en .env, lo usaremos para borrar también con domain
  const domain = process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.trim() !== ""
    ? process.env.COOKIE_DOMAIN.trim()
    : null;

  // Cuando se setea con sameSite:'none' necesitas secure:true (solo en https)
  // Para localhost, típicamente sameSite:'lax' y secure:false.
  const sameSite = (process.env.COOKIE_SAMESITE || "").toLowerCase() || (isProd || usingHttps ? "none" : "lax");
  const secure   = ((process.env.COOKIE_SECURE || "").toLowerCase() === "true") || (isProd && usingHttps);

  return {
    base:  { path: "/", sameSite, secure },
    withDomain: domain ? { path: "/", domain, sameSite, secure } : null,
  };
}

// OJO: esta ruta se monta como "/logout" en server.js; aquí debe ser "/"
router.post("/", async (req, res) => {
  try {
    // 1) Captura token ANTES de limpiar cookies (de cualquier cookie de rol o Authorization)
    const { token } = getTokenFromReq(req);

    // 2) Limpia TODAS las cookies por rol + la legacy "token"
    const opts = buildClearOpts(req);
    const names = [
      COOKIE_NAMES.alumno,
      COOKIE_NAMES.maestro,
      COOKIE_NAMES.administrador,
      COOKIE_NAMES.admin_principal,
      "token", // legado
    ];

    try {
      // Limpieza sin domain
      for (const n of names) res.clearCookie(n, opts.base);
      // Limpieza adicional con domain (si aplica)
      if (opts.withDomain) {
        for (const n of names) res.clearCookie(n, opts.withDomain);
      }
    } catch (_) {
      // Nunca romper el logout por un fallo limpiando cookies
    }

    // 3) Si no hay token, ya está (lado cliente quedó limpio)
    if (!token) {
      return res.status(200).json({ message: "Sesión cerrada." });
    }

    // 4) Verifica token; si falla, igualmente devolvemos 200 (logout idempotente)
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(200).json({ message: "Sesión cerrada." });
    }

    const role = payload?.role;
    const userId = payload?.userId || payload?._id || payload?.id;

    const UserModel = modelos[role];
    if (!UserModel || !userId) {
      return res.status(200).json({ message: "Sesión cerrada." });
    }

    // 5) Best-effort en BD: revocar token si hay helper; si no, marcar inactivo
    try {
      const user = await UserModel.findById(userId);
      if (user) {
        if (typeof user.revokeToken === "function") {
          await user.revokeToken(); // limpia token/tokenExpiresAt/estado según tu modelo
        } else {
          // Mantén tu semántica: enum "inactivo" | "conectado"
          user.estado = "inactivo";
          // Si tu esquema tiene lastSeen/lastLogout, lo actualiza sin romper si no existe
          if ("lastLogout" in user) user.lastLogout = new Date();
          await user.save({ validateBeforeSave: false });
        }
      }
    } catch (e) {
      // No interrumpir logout si falla la BD
      console.warn("logout: aviso al persistir estado:", e?.message || e);
    }

    return res.status(200).json({ message: "Sesión cerrada." });
  } catch (err) {
    console.error("Logout error:", err?.message || err);
    // Nunca romper el flujo de logout
    return res.status(200).json({ message: "Sesión cerrada." });
  }
});

module.exports = router;


