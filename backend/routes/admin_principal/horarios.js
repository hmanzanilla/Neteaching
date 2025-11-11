// routes/admin_principal/horarios.js
const express = require("express");
const router = express.Router();
const { validarHorario } = require("../../middlewares/admin_principal/horarios");

const Grupo = require("../../models_grupos/grupoModel");
const Horario = require("../../models_grupos/horarioModel");

// Ruta para crear un nuevo horario
router.post("/", validarHorario, async (req, res) => {
  try {
    const { grupoId, nombreHorario, bimestre, horario } = req.body;

    // Crear nuevo horario
    const nuevoHorario = new Horario({
      grupoId,
      nombreHorario,
      bimestre,
      horario,
    });

    await nuevoHorario.save();

    console.log("✅ Horario creado correctamente:", nuevoHorario._id);
    res.status(201).json({
      message: "Horario creado exitosamente",
      horario: nuevoHorario
    });

  } catch (error) {
    console.error("❌ Error al crear el horario:", error);
    res.status(500).json({ error: "Error al crear el horario" });
  }
});

module.exports = router;
