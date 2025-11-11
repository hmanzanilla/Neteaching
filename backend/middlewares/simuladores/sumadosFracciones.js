// c:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1.3.3\middlewares\simuladores\sumadosFracciones.js
// c:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1.3.3\middlewares\simuladores\sumadosFracciones.js

const mongoose = require("mongoose");

/**
 * ✅ Middleware de validación de datos para el simulador "Suma de dos fracciones".
 * - Verifica que los campos requeridos estén presentes y correctos.
 */
const validateSumadosFracciones = (req, res, next) => {
  const { usuarioId, tiempoMinutos, tiempoSegundos, tiempoTotal, operaciones } = req.body;

  // 🔹 Validar usuarioId
  if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ error: "usuarioId inválido o faltante." });
  }

  // 🔹 Validar tiempoMinutos
  if (typeof tiempoMinutos !== "number" || tiempoMinutos < 0) {
    return res.status(400).json({ error: "tiempoMinutos inválido o faltante." });
  }

  // 🔹 Validar tiempoSegundos
  if (typeof tiempoSegundos !== "number" || tiempoSegundos < 0 || tiempoSegundos > 59) {
    return res.status(400).json({ error: "tiempoSegundos inválido (debe ser entre 0 y 59)." });
  }

  // 🔹 Validar tiempoTotal
  if (typeof tiempoTotal !== "number" || tiempoTotal <= 0) {
    return res.status(400).json({ error: "tiempoTotal inválido o faltante." });
  }

  // 🔹 Validar operaciones
  if (typeof operaciones !== "number" || operaciones < 0) {
    return res.status(400).json({ error: "operaciones inválido o faltante." });
  }

  // ✅ Todos los datos están correctos, continuar
  next();
};

module.exports = { validateSumadosFracciones };
