// routes/general/bimestreActual.js
// routes/general/bimestreActual.js
const express = require("express");
const router = express.Router();
const BimestreActual = require("../../models_general/bimestreActualModel");
const { authenticate, ensureAdminPrincipal } = require("../../middlewares/admin_principal/auth_admin_principal");

// 🔹 GET: Obtener el bimestre actual
router.get("/", async (req, res) => {
  try {
    const actual = await BimestreActual.findOne().sort({ updatedAt: -1 });
    if (!actual) {
      return res.status(404).json({ message: "No hay bimestre actual definido." });
    }
    res.json({ bimestre: actual.bimestre });
  } catch (error) {
    console.error("❌ Error al obtener el bimestre actual:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// 🔹 POST: Establecer o actualizar el bimestre actual (solo admin principal)
router.post("/", authenticate, ensureAdminPrincipal, async (req, res) => {
  try {
    const { bimestre } = req.body;

    if (!bimestre) {
      return res.status(400).json({ error: "El campo 'bimestre' es obligatorio." });
    }

    const actualizado = await BimestreActual.findOneAndUpdate(
      {}, // No se especifica filtro porque solo debe haber uno
      {
        bimestre,
        actualizadoPor: req.user._id,
        fechaActualizacion: new Date()
      },
      { upsert: true, new: true } // Crea si no existe, devuelve el actualizado
    );

    res.status(201).json({ message: "✅ Bimestre actualizado correctamente", bimestre: actualizado.bimestre });
  } catch (error) {
    console.error("❌ Error al establecer el bimestre:", error);
    res.status(500).json({ error: "Error al establecer el bimestre actual" });
  }
});

module.exports = router;
