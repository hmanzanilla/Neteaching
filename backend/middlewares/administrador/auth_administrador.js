// backend/middlewares/administrador/auth_administrador.js
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UserAdministrador = require("../../models/User_admin"); // Discriminador 'administrador'
const { COOKIE_NAMES, getTokenFromReq } = require("../../utils/authCookies");

/**
 * 🔐 Autenticación para usuarios con rol "administrador"
 * - Lee token desde cookie httpOnly específica del rol ("token_administrador") o Bearer
 * - Verifica firma y rol
 * - Comprueba sesión única / vigencia via user.isTokenValid(token)
 * - Inyecta req.user (sin password) y req.token
 */
const authenticateAdministrador = async (req, res, next) => {
  try {
    // 1) Extraer token (preferencia: cookie del rol administrador)
    const { token } = getTokenFromReq(req, COOKIE_NAMES.administrador);
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
    if (role !== "administrador") {
      return res.status(403).json({ error: "Acceso denegado: rol no autorizado." });
    }

    // 3) Cargar usuario (discriminador 'administrador')
    const user = await UserAdministrador.findOne({ _id: userId, role: "administrador" })
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
    } else if (user.token !== token) {
      return res.status(403).json({ error: "Token inválido o revocado." });
    }

    // 6) Heartbeat opcional
    if (typeof user.touchHeartbeat === "function") {
      await user.touchHeartbeat();
    }

    // 7) Inyectar en request
    req.user = user;
    req.token = token;
    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Error en autenticación." });
  }
};

/** 🛡️ Autorización por rol (igual que maestro) */
const authorizeAdministrador = (roles = ["administrador"]) => {
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

// ✅ Igual que maestro: export por defecto (middleware) + export nombrado opcional
module.exports = authenticateAdministrador;
module.exports.authorizeAdministrador = authorizeAdministrador;
