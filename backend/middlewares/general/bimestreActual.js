// middleware/general/bimestreActual.js
// middlewares/general/bimestreActual.js

const BimestreActual = require("../../models_general/bimestreActualModel");

/**
 * 🔹 Middleware: Carga el bimestre actual desde la base de datos
 * - Agrega `req.bimestreActual` si está definido.
 */
const obtenerBimestreActual = async (req, res, next) => {
  try {
    const bimestre = await BimestreActual.findOne().sort({ updatedAt: -1  });

    if (!bimestre) {
      console.warn("⚠️ No se ha definido el bimestre actual.");
      req.bimestreActual = null;
    } else {
      req.bimestreActual = bimestre.bimestre;
    }

    next();
  } catch (error) {
    console.error("❌ Error al obtener el bimestre actual:", error);
    return res.status(500).json({ error: "Error al obtener el bimestre actual" });
  }
};

module.exports = { obtenerBimestreActual };
