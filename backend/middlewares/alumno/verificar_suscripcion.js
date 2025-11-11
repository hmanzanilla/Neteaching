// middlewares/alumno/verificar_suscripcion.js
// 🚀 Middleware para verificar la autenticación del alumno antes de consultar su suscripción
const jwt = require("jsonwebtoken");
const winston = require("winston");

// 📌 Configurar Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "verificar_suscripcion.log" }),
    new winston.transports.Console(),
  ],
});

/**
 * ✅ Middleware para verificar si el usuario está autenticado y es un alumno
 */
const authenticateSuscripcionAlumno = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      logger.warn("🔒 Intento de acceso sin token en verificación de suscripción");
      return res.status(401).json({ error: "Acceso denegado. No se encontró token." });
    }

    // 📌 Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 📌 Verificar si el usuario tiene el rol correcto
    if (decoded.role !== "alumno") {
      logger.warn(`⚠ Acceso no autorizado. Usuario con rol: ${decoded.role}`);
      return res.status(403).json({ error: "Acceso restringido solo para alumnos." });
    }

    // ✅ Si la verificación es correcta, se añade la información del usuario a `req.user`
    req.user = decoded;
    logger.info(`✅ Token válido para el usuario: ${decoded.email}, ID: ${decoded._Id}`);

    next();
  } catch (error) {
    logger.error(`❌ Error de autenticación en verificar suscripción: ${error.message}`);
    return res.status(401).json({ error: "Token no válido o expirado." });
  }
};

module.exports = { authenticateSuscripcionAlumno };
