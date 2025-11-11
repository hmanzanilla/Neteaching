// backend/routes/maestro/crear_aulas.js
// backend/routes/maestro/crear_aulas.js
const express = require("express");
const router = express.Router();

const Aula = require("../../ModelAulas/Aula");
const authenticateMaestro = require("../../middlewares/maestro/auth_maestro");
const {
  validarCreacionAula,
  validarSetHorarios,
} = require("../../middlewares/maestro/crear_aulas");

/**
 * POST /api/maestro/crear-aulas
 * Crear un aula (puede venir con horarios o sin ellos)
 */
router.post("/", authenticateMaestro, validarCreacionAula, async (req, res) => {
  try {
    const { nombre, grupoEtiqueta, tz, materia, horarios } = req.aulaPayload;
    const owner = req.user._id; // ← Maestro autenticado

    const aula = await Aula.create({ owner, nombre, grupoEtiqueta, tz, materia, horarios });
    return res.status(201).json({ message: "Aula creada", aula });
  } catch (err) {
    if (err?.code === 11000) {
      // Índice único (ej. owner + grupoEtiquetaSlug) violado
      return res.status(409).json({
        message: "Ya existe un aula con esa etiqueta para este maestro",
        detalle: err?.keyValue,
      });
    }
    return res.status(500).json({ message: "Error interno", detalle: err?.message });
  }
});

/**
 * POST /api/maestro/crear-aulas/:id/horarios
 * Reemplaza los horarios del aula por la lista normalizada validada
 */
router.post("/:id/horarios", authenticateMaestro, validarSetHorarios, async (req, res) => {
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
 * GET /api/maestro/crear-aulas
 * Lista de aulas del maestro autenticado
 */
router.get("/", authenticateMaestro, async (req, res) => {
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
 * GET /api/maestro/crear-aulas/:id
 * Detalle de un aula del maestro (asegurando pertenencia)
 */
router.get("/:id", authenticateMaestro, async (req, res) => {
  try {
    const aula = await Aula.findOne({ _id: req.params.id, owner: req.user._id });
    if (!aula) return res.status(404).json({ message: "Aula no encontrada" });

    return res.json({ aula });
  } catch (err) {
    return res.status(500).json({ message: "Error leyendo aula", detalle: err?.message });
  }
});

/**
 * DELETE /api/maestro/crear-aulas/:id
 * Elimina un aula del maestro autenticado (hard delete)
 */
router.delete("/:id", authenticateMaestro, async (req, res) => {
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
