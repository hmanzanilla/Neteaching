// backend/routes/alumno/auth_suscripcion
const express = require("express");
const authenticateSuscripcionAlumno = require("../../middlewares/alumno/auth_suscripcion");
const User_alumno = require("../../models/User_alumno");
const winston = require("winston");

const router = express.Router();

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

router.post("/confirmar", authenticateSuscripcionAlumno, async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`📌 Procesando suscripción para el alumno: ${userId}`);

    const user = await User_alumno.findByIdAndUpdate(
      userId,
      { status: "active" },
      { new: true }
    );

    if (!user) {
      logger.warn(`⚠ Alumno no encontrado al actualizar estado: ${userId}`);
      return res.status(404).json({ error: "Alumno no encontrado." });
    }

    logger.info(`✅ Suscripción confirmada para el usuario: ${userId}`);
    res.json({ message: "Suscripción completada con éxito.", status: user.status });

  } catch (error) {
    logger.error(`❌ Error al confirmar suscripción: ${error.message}`);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;