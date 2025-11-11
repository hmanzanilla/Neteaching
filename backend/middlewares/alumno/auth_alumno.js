// middlewares/alumno/auth_alumno.js
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UserAlumno = require("../../models/User_alumno");
const { COOKIE_NAMES, getTokenFromReq } = require("../../utils/authCookies");

/**
 * 🔐 Autenticación para rol "alumno"
 * @param {boolean} requiereActivo - Si true, exige status === 'active'. No bloquea por 'estado'.
 */
const authenticateAlumno = (requiereActivo = true) => {
  return async (req, res, next) => {
    try {
      // 1) Extraer token priorizando la cookie específica de alumno
      const { token } = getTokenFromReq(req, COOKIE_NAMES.alumno);
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

      const userId = decoded.userId || decoded._id || decoded.id || decoded.sub;
      const role = decoded.role;

      if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        return res.status(401).json({ error: "Token inválido." });
      }
      if (role !== "alumno") {
        return res.status(403).json({ error: "Acceso denegado: rol no autorizado." });
      }

      // 3) Cargar alumno (sin password)
      const user = await UserAlumno.findOne({ _id: userId, role: "alumno" })
        .select("-password");
      if (!user) {
        return res.status(401).json({ error: "Usuario no autorizado." });
      }

      // 4) Estado de cuenta (si se exige activo)
      if (requiereActivo && user.status !== "active") {
        return res.status(403).json({ error: "Usuario inactivo." });
      }

      // 5) Sesión única / vigencia (si el modelo expone helpers)
      if (typeof user.isTokenValid === "function") {
        if (!user.isTokenValid(token)) {
          return res.status(403).json({ error: "Token inválido, revocado o expirado." });
        }
      } else if ("token" in user && user.token && user.token !== token) {
        return res.status(403).json({ error: "Token revocado." });
      }

      // 6) Heartbeat opcional
      try {
        if (typeof user.touchHeartbeat === "function") {
          await user.touchHeartbeat();
        } else if ("lastSeenAt" in user) {
          user.lastSeenAt = new Date();
          await user.save({ validateBeforeSave: false });
        }
      } catch (_) {
        // no bloquear por heartbeat
      }

      // 7) Inyectar en request
      req.user = user;
      req.token = token;
      next();
    } catch (err) {
      console.error("❌ authenticateAlumno error:", err?.message || err);
      return res.status(401).json({ error: "Error en autenticación." });
    }
  };
};

module.exports = authenticateAlumno;


