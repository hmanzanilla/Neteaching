// middlewares/alumno/auth_alumno_pruebas.js
// 🚀 Middlewares de autenticación de pruebas para alumnos
// 🚀 Middleware de autenticación para pruebas de alumnos
const jwt = require("jsonwebtoken");
const winston = require("winston");
const Prueba = require("../../models_pruebas/pruebasModel"); // Nuevo modelo

// 📌 Configurar Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "auth_alumno_pruebas.log" }),
    new winston.transports.Console(),
  ],
});

// ✅ Middleware para verificar el token y si el alumno tiene prueba registrada
const authenticatePruebaAlumno = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      logger.warn("🔒 Intento de acceso a pruebas sin token.");
      return res.status(401).json({ error: "Acceso denegado. No se encontró token." });
    }

    // 📌 Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 📌 Verificar que el usuario es un alumno
    if (decoded.role !== "alumno") {
      logger.warn(`⚠ Acceso no autorizado. Usuario con rol: ${decoded.role}`);
      return res.status(403).json({ error: "Acceso restringido solo para alumnos." });
    }

    const alumnoId = decoded.userId;

    // 📌 Buscar en la base de datos si el alumno tiene una prueba registrada
    const prueba = await Prueba.findOne({ alumnoId });

    if (!prueba) {
      logger.info(`✅ Alumno ${alumnoId} aún no ha realizado la prueba (opcional).`);
      req.user = decoded;
      req.haRealizadoPrueba = false; // 🔹 Indicar que no ha realizado la prueba
      return next(); // 🔥 Permite continuar, la prueba es opcional
    }

    // 📌 Alumno ya realizó la prueba
    logger.info(`📌 Alumno ${alumnoId} ya tiene una prueba registrada.`);
    req.user = decoded;
    req.haRealizadoPrueba = true;
    req.pruebaData = prueba; // 🔹 Enviar datos de la prueba en la solicitud

    next();
  } catch (err) {
    logger.error(`❌ Token no válido o error en la consulta: ${err.message}`);
    return res.status(401).json({ error: "Token no válido o error en la autenticación." });
  }
};

module.exports = authenticatePruebaAlumno;

