// routes/admin_principal/grupos.js
// routes/admin_principal/grupos.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Grupo = require("../../models_grupos/grupoModel");
const { authenticate, ensureAdminPrincipal } = require("../../middlewares/admin_principal/auth_admin_principal");
const { validarGrupo } = require("../../middlewares/admin_principal/grupos");

// 📌 Ruta para crear un nuevo grupo (solo para admin_principal)
router.post("/", authenticate, ensureAdminPrincipal, validarGrupo, async (req, res) => {
  try {
    const { nombre, turno, bimestre, curpProfesor } = req.body;

    // Crear y guardar el grupo con el ID del admin actual
    const nuevoGrupo = new Grupo({
      nombre,
      turno,
      bimestre,
      curpProfesor,
      admin_creador: req.user._id
    });

    await nuevoGrupo.save();

    console.log("✅ Grupo creado correctamente:", nuevoGrupo._id);
    res.status(201).json({ message: "Grupo creado exitosamente", grupo: nuevoGrupo });

  } catch (error) {
    console.error("❌ Error al crear el grupo:", error);
    res.status(500).json({ error: "Error interno al crear el grupo" });
  }
});

// 📌 (Opcional) Ruta para obtener todos los grupos creados
router.get("/", authenticate, ensureAdminPrincipal, async (req, res) => {
  try {
    const grupos = await Grupo.find().populate("admin_creador", "email firstName lastName");
    res.json(grupos);
  } catch (error) {
    console.error("❌ Error al obtener grupos:", error);
    res.status(500).json({ error: "Error al obtener los grupos" });
  }
});

module.exports = router;
