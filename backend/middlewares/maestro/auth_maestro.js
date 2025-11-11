// middlewares/maestro/auth_maestro.js
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UserMaestro = require("../../models/User_maestro"); // Discriminador 'maestro'
const { COOKIE_NAMES, getTokenFromReq } = require("../../utils/authCookies");

/**
 * 🔐 Autenticación para usuarios con rol "maestro"
 * - Lee token desde cookie httpOnly específica del rol ("token_maestro") o Bearer
 * - Verifica firma y rol
 * - Comprueba sesión única / vigencia via user.isTokenValid(token) (si existe)
 * - Inyecta req.user (sin password) y req.token
 */
const authenticateMaestro = async (req, res, next) => {
  try {
    // 1) Extraer token (preferencia: cookie del rol maestro)
    const { token } = getTokenFromReq(req, COOKIE_NAMES.maestro);
    if (!token) {
      return res.status(401).json({ error: "Falta el token de autenticación." });
    }

    // 2) Verificar JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_e) {
      return res.status(401).json({ error: "Token inválido o expirado." });
    }

    const userId = decoded.userId || decoded._id || decoded.id;
    const role = decoded.role;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ error: "Token inválido." });
    }
    if (role !== "maestro") {
      return res.status(403).json({ error: "Acceso denegado: rol no autorizado." });
    }

    // 3) Cargar usuario (discriminador 'maestro') sin password
    const user = await UserMaestro.findOne({ _id: userId, role: "maestro" })
      .select("-password");
    if (!user) {
      return res.status(401).json({ error: "Usuario no autorizado." });
    }

    // 4) Estado de negocio
    if (user.status !== "active") {
      return res.status(403).json({ error: "Usuario inactivo." });
    }

    // 5) Sesión única / vigencia contra BD
    if (typeof user.isTokenValid === "function") {
      if (!user.isTokenValid(token)) {
        return res.status(403).json({ error: "Token inválido, revocado o expirado." });
      }
    } else if (user.token && user.token !== token) {
      // Fallback si tu modelo guarda token
      return res.status(403).json({ error: "Token inválido o revocado." });
    }

    // 6) Heartbeat opcional
    try {
      if (typeof user.touchHeartbeat === "function") {
        await user.touchHeartbeat();
      } else if ("lastSeenAt" in user) {
        user.lastSeenAt = new Date();
        await user.save({ validateBeforeSave: false });
      }
    } catch (_hbErr) {
      // No bloquear por errores de heartbeat
    }

    // 7) Inyectar en request y continuar
    req.user = user;
    req.token = token;
    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Error en autenticación." });
  }
};

/** 🛡️ Autorización por rol (igual que en administrador) */
const authorizeMaestro = (roles = ["maestro"]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: "No autenticado." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No autorizado." });
    }
    next();
  };
};

module.exports = authenticateMaestro;
module.exports.authorizeMaestro = authorizeMaestro;



