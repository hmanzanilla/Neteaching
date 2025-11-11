// routes/alumno/auth_alumno_pruebas.js
// 📌 auth_alumno_pruebas.js - Rutas para autenticación y registro de pruebas de alumnos
// routes/alumno/auth_alumno_pruebas.js
// 🚀 Rutas de autenticación para el registro de pruebas de alumnos
// 🚀 Rutas para autenticación y registro de pruebas de alumnos
const express = require("express");
const authenticatePruebaAlumno = require("../../middlewares/alumno/auth_alumno_pruebas");
const Prueba = require("../../models_pruebas/pruebasModel"); // 📍 Ruta correcta del modelo
const router = express.Router();
const winston = require("winston");

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

/**
 * ✅ Obtener el estado de la prueba de un alumno
 * 📌 Método: GET /api/pruebas/estado/:userId
 */
router.get("/estado/:userId", authenticatePruebaAlumno, async (req, res) => {
  try {
    const { userId } = req.params;
    logger.info(`📌 Consultando estado de prueba para el usuario: ${userId}`);

    // 📌 Buscar si el alumno ya tiene una prueba registrada
    const prueba = await Prueba.findOne({ alumnoId: userId });

    if (!prueba) {
      logger.info(`✅ Alumno ${userId} aún no ha realizado la prueba.`);
      return res.json({ haRealizadoPrueba: false });
    }

    res.json({
      haRealizadoPrueba: true,
      pruebaData: {
        pruebaId: prueba._id,
        calificacion: prueba.calificacion,
        fechaRealizacion: prueba.fechaRealizacion,
      },
    });
  } catch (error) {
    logger.error(`❌ Error al obtener el estado de la prueba: ${error.message}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * ✅ Registrar una nueva prueba realizada por el alumno
 * 📌 Método: POST /api/pruebas/registrar
 */
router.post("/registrar", authenticatePruebaAlumno, async (req, res) => {
  try {
    const { userId, calificacion, pruebaId } = req.body;
    logger.info(`📝 Registrando prueba para el usuario: ${userId}`);

    // 📌 Verificar si ya existe una prueba registrada
    const pruebaExistente = await Prueba.findOne({ alumnoId: userId });

    if (pruebaExistente) {
      logger.warn(`⚠ Alumno ${userId} ya tiene una prueba registrada.`);
      return res.status(400).json({ error: "La prueba ya fue realizada." });
    }

    // 📌 Crear y guardar la nueva prueba
    const nuevaPrueba = new Prueba({
      alumnoId: userId,
      pruebaId,
      calificacion,
      fechaRealizacion: new Date(),
    });

    await nuevaPrueba.save();

    logger.info(`✅ Prueba registrada con éxito para el usuario: ${userId}`);
    res.json({ message: "Prueba marcada como realizada.", prueba: nuevaPrueba });

  } catch (error) {
    logger.error(`❌ Error al registrar la prueba: ${error.message}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * ✅ Actualizar la información de una prueba (ejemplo: calificación)
 * 📌 Método: PUT /api/pruebas/actualizar/:userId
 */
router.put("/actualizar/:userId", authenticatePruebaAlumno, async (req, res) => {
  try {
    const { userId } = req.params;
    const { calificacion } = req.body;
    logger.info(`🔄 Actualizando prueba para el usuario: ${userId}`);

    const prueba = await Prueba.findOne({ alumnoId: userId });

    if (!prueba) {
      logger.warn(`⚠ No se encontró prueba para el usuario: ${userId}`);
      return res.status(404).json({ error: "Prueba no encontrada." });
    }

    // 📌 Actualizar calificación
    prueba.calificacion = calificacion;
    await prueba.save();

    logger.info(`✅ Prueba actualizada para el usuario: ${userId}`);
    res.json({ message: "Prueba actualizada correctamente.", prueba });

  } catch (error) {
    logger.error(`❌ Error al actualizar la prueba: ${error.message}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
