// backend/routes/general/buscarProfesor.js
const express = require("express");
const router = express.Router();
const UserMaestro = require("../../models/User_maestro"); // ✅ Modelo correcto

// 🔍 Buscar profesor por su CURP (modelo: user_maestro)
router.get("/:curp", async (req, res) => {
  const { curp } = req.params;

  try {
    const profesor = await UserMaestro.findOne({
      curp,
      role: "maestro",
      status: "active"
    });

    if (!profesor) {
      return res.status(404).json({ error: "Profesor no encontrado o no activo." });
    }

    const nombreCompleto = `${profesor.firstName} ${profesor.lastName}`;
    res.json({ nombreProfesor: nombreCompleto });

  } catch (error) {
    console.error("❌ Error al buscar profesor:", error);
    res.status(500).json({ error: "Error del servidor al buscar el profesor." });
  }
});

module.exports = router;