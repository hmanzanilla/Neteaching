// middlewares/alumno/auth_suscripcion.js
const jwt = require("jsonwebtoken");
const User = require("../../models/User_alumno"); // ✅ Modelo específico de alumno
const winston = require("winston");

// 📌 Configurar Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "auth_suscripcion.log" }),
    new winston.transports.Console(),
  ],
});

// ✅ Middleware para verificar token y permitir solo a alumnos con estado `pending`
const authenticateSuscripcionAlumno = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      logger.warn("🔒 Intento de acceso sin token en suscripción.");
      return res.status(401).json({ error: "Acceso denegado. No se encontró token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`⚠ Usuario no encontrado para la suscripción: ${userId}`);
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (user.role !== "alumno") {
      logger.warn(`⚠ Acceso no autorizado. Usuario con rol: ${user.role}`);
      return res.status(403).json({ error: "Acceso restringido solo para alumnos." });
    }

    if (user.status !== "pending") {
      logger.warn(`⚠ Intento de suscripción inválido. Estado actual: ${user.status}`);
      return res.status(403).json({ error: "Solo los alumnos en estado 'pending' pueden suscribirse." });
    }

    logger.info(`✅ Alumno autorizado para suscripción: ${userId}`);
    req.user = user;
    next();
  } catch (err) {
    logger.error(`❌ Error en autenticación de suscripción: ${err.message}`);
    return res.status(401).json({ error: "Token no válido o expirado." });
  }
};

module.exports = authenticateSuscripcionAlumno;