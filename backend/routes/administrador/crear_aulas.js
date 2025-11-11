// backend/routes/administrador/crear_aulas.js
const express = require("express");
const router = express.Router();

const Aula = require("../../ModelAulas/Aula");

// ✅ Middleware propio del ADMIN (no el de maestro)
const authenticateAdministrador = require("../../middlewares/administrador/auth_administrador");

// ✅ Validadores del ADMIN (clonados físicamente en /middlewares/administrador)
const {
  validarCreacionAula,
  validarSetHorarios,
} = require("../../middlewares/administrador/crear_aulas");

/**
 * POST /api/administrador/crear-aulas
 * Crear un aula (puede venir con horarios o sin ellos)
 */
router.post("/", authenticateAdministrador, validarCreacionAula, async (req, res) => {
  try {
    const { nombre, grupoEtiqueta, tz, materia, horarios } = req.aulaPayload;
    const owner = req.user._id; // ← Administrador autenticado (o el propietario deseado)

    const aula = await Aula.create({ owner, nombre, grupoEtiqueta, tz, materia, horarios });
    return res.status(201).json({ message: "Aula creada", aula });
  } catch (err) {
    if (err?.code === 11000) {
      // Índice único (ej. owner + grupoEtiquetaSlug) violado
      return res.status(409).json({
        message: "Ya existe un aula con esa etiqueta para este administrador",
        detalle: err?.keyValue,
      });
    }
    return res.status(500).json({ message: "Error interno", detalle: err?.message });
  }
});

/**
 * POST /api/administrador/crear-aulas/:id/horarios
 * Reemplaza los horarios del aula por la lista normalizada validada
 */
router.post("/:id/horarios", authenticateAdministrador, validarSetHorarios, async (req, res) => {
  try {
    const { id } = req.params;

    // Asegurar pertenencia del recurso
    const aula = await Aula.findOne({ _id: id, owner: req.user._id });
    if (!aula) return res.status(404).json({ message: "Aula no encontrada" });

    aula.horarios = req.horariosPayload;
    await aula.save(); // valida solapes y formato en los hooks del modelo

    return res.json({ message: "Horarios actualizados", horarios: aula.horarios });
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detalle: err?.message });
  }
});

/**
 * GET /api/administrador/crear-aulas
 * Lista de aulas del administrador autenticado
 */
router.get("/", authenticateAdministrador, async (req, res) => {
  try {
    const aulas = await Aula.find({ owner: req.user._id })
      .select("_id nombre grupoEtiqueta materia tz horarios createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.json({ aulas });
  } catch (err) {
    return res.status(500).json({ message: "Error listando aulas", detalle: err?.message });
  }
});

/**
 * GET /api/administrador/crear-aulas/:id
 * Detalle de un aula del administrador (asegurando pertenencia)
 */
router.get("/:id", authenticateAdministrador, async (req, res) => {
  try {
    const aula = await Aula.findOne({ _id: req.params.id, owner: req.user._id });
    if (!aula) return res.status(404).json({ message: "Aula no encontrada" });

    return res.json({ aula });
  } catch (err) {
    return res.status(500).json({ message: "Error leyendo aula", detalle: err?.message });
  }
});

/**
 * DELETE /api/administrador/crear-aulas/:id
 * Elimina un aula del administrador autenticado (hard delete)
 */
router.delete("/:id", authenticateAdministrador, async (req, res) => {
  try {
    const { id } = req.params;
    const aula = await Aula.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!aula) return res.status(404).json({ message: "Aula no encontrada" });
    return res.json({ message: "Aula eliminada" });
  } catch (err) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "ID de aula inválido" });
    }
    return res.status(500).json({ message: "Error eliminando aula", detalle: err?.message });
  }
});

/** (Opcional) Health check rápido */
router.get("/__ping", (_req, res) => res.json({ ok: true }));

module.exports = router;

