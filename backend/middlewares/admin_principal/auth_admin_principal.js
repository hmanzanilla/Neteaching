// backend/middlewares/admin_principal/auth_admin_principal.js
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UserAdminPrincipal = require("../../models/User_admin_principal"); // Discriminador admin_principal

// ⬇️ NUEVO: helpers de cookies por rol
const { COOKIE_NAMES, getTokenFromReq } = require("../../utils/authCookies");

/**
 * 🔐 Middleware de autenticación para administrador principal
 * - Lee token de cookie httpOnly "token_admin_principal" o Header Authorization: Bearer
 * - Verifica firma y extrae userId/role
 * - Busca al usuario (solo role=admin_principal)
 * - Valida sesión única con isTokenValid(token) (revocado/expirado)
 * - (Opcional) Refresca heartbeat con touchHeartbeat()
 * - Inyecta req.user (sin password) y req.token
 */
const authenticate = async (req, res, next) => {
  try {
    // 1) Extraer token (preferimos la cookie dedicada del rol)
    const { token } = getTokenFromReq(req, COOKIE_NAMES.admin_principal);
    if (!token) {
      return res.status(401).json({ error: "No autenticado: token no proporcionado." });
    }

    // 2) Verificar JWT (firma/exp)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token inválido o expirado." });
    }

    const userId = decoded.userId || decoded._id || decoded.id;
    const role = decoded.role;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ error: "Token inválido: ID mal formado." });
    }
    if (role !== "admin_principal") {
      return res.status(403).json({ error: "Acceso denegado: rol no autorizado." });
    }

    // 3) Buscar usuario solo con el discriminador admin_principal
    const user = await UserAdminPrincipal.findOne({ _id: userId, role: "admin_principal" })
      .select("-password");
    if (!user) {
      return res.status(401).json({ error: "Usuario no autorizado o no encontrado." });
    }

    // 4) Estado de negocio
    if (user.status !== "active") {
      return res.status(403).json({ error: "Usuario inactivo." });
    }

    // 5) Sesión única y vigencia: valida contra la BD
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

    // 7) Inyectar en request y continuar
    req.user = user;
    req.token = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Error en autenticación." });
  }
};

/**
 * ✅ Middleware para verificar rol de administrador principal
 */
const ensureAdminPrincipal = (req, res, next) => {
  if (!req.user || req.user.role !== "admin_principal") {
    return res.status(403).json({ error: "Acceso denegado: se requiere rol de administrador principal." });
  }
  return next();
};

module.exports = { authenticate, ensureAdminPrincipal };
