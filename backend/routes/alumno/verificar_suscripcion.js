// routes/alumno/verificar_suscripcion.js
const express = require("express");
const PagoSuscripcion = require("../../models_pagos_suscripcion/pagoSuscripcionModel");
const { authenticateSuscripcionAlumno } = require("../../middlewares/alumno/verificar_suscripcion");
const router = express.Router();
const winston = require("winston");

// 📌 Logger para seguimiento
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

// ✅ Ruta para verificar suscripción del alumno
router.get("/", authenticateSuscripcionAlumno, async (req, res) => {
  try {
    logger.info("🔍 Iniciando verificación de suscripción");

    const userId = req.user._id;
    if (!userId) {
      logger.error("❌ Error: _id no está disponible en req.user");
      return res.status(400).json({ error: "ID de usuario no válido." });
    }

    logger.info(`🔍 Verificando suscripción para usuario ID: ${userId}`);

    const suscripcion = await PagoSuscripcion.findOne({ userId }).sort({ fecha_pago: -1 });

    if (!suscripcion) {
      logger.warn(`⚠️ No se encontró ninguna suscripción para el usuario con ID: ${userId}`);
      return res.json({ tieneSuscripcion: false, estado: "sin suscripción" });
    }

    // 🔁 Verificación automática de expiración
    const ahora = new Date();
    const expirado = suscripcion.fecha_expiracion < ahora;
    const estado = expirado ? "expirado" : suscripcion.estado_suscripcion;

    logger.info(`✅ Resultado: ${estado} | Paquete: ${suscripcion.paquete}`);

    res.json({
      tieneSuscripcion: true,
      estado,
      paquete: suscripcion.paquete,
      fecha_pago: suscripcion.fecha_pago,
      metodo_pago: suscripcion.metodo_pago,
      fecha_expiracion: suscripcion.fecha_expiracion,
    });
  } catch (error) {
    logger.error(`❌ Error al verificar la suscripción: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;