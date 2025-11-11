// routes/alumno/seleccionarGrupo.js
// routes/alumno/seleccionarGrupo.js

const express = require("express");
const router = express.Router();

const authenticateAlumno = require("../../middlewares/alumno/auth_alumno");
const { cargarBimestreActual, validarSeleccionGrupo } = require("../../middlewares/alumno/seleccionarGrupo");
const EleccionGrupo = require("../../ModelAulas/eleccionGrupoModel");

/**
 * POST /api/seleccionarGrupo
 * Inscribir/seleccionar grupo (alumno autenticado)
 * Flujo:
 *  - authenticateAlumno(true): exige alumno autenticado (y activo si tu MW lo aplica)
 *  - cargarBimestreActual: resuelve bimestre vigente (número/texto) y lo pone en req.ctx
 *  - validarSeleccionGrupo: valida grupo, horario y unicidad (alumnoId + bimestre)
 *  - handler: crea documento en elecciongrupos con denormalizados útiles
 */
router.post(
  "/",
  authenticateAlumno(true),
  cargarBimestreActual,
  validarSeleccionGrupo,
  async (req, res) => {
    try {
      const { bimestreNumero, bimestreTexto, alumnoId, grupoDoc, horarioDoc } = req.ctx || {};

      const doc = await EleccionGrupo.create({
        alumnoId,
        grupoId: grupoDoc._id,
        bimestre: bimestreNumero,
        // estado por defecto = "confirmed", fuente = "auto"
        nombreGrupo: grupoDoc.nombre,
        turno: grupoDoc.turno,
        nombreHorario: horarioDoc.nombreHorario,
        curpProfesor: grupoDoc.curpProfesor,
        fecha_asignacion: new Date(),
      });

      return res.status(201).json({
        status: "confirmed",
        message: "Asignación confirmada.",
        bimestre: bimestreNumero,
        bimestreTexto,
        aula: {
          grupoId: String(grupoDoc._id),
          nombreGrupo: grupoDoc.nombre,
          turno: grupoDoc.turno,
          bimestre: bimestreNumero,
          nombreHorario: horarioDoc.nombreHorario,
          curpProfesor: grupoDoc.curpProfesor,
        },
        eleccionId: String(doc._id),
      });
    } catch (err) {
      console.error("❌ Error al crear la inscripción:", err);
      // Violación de índice único: alumno ya tenía inscripción en este bimestre
      if (err?.code === 11000) {
        return res.status(409).json({
          error: "Ya tienes una inscripción confirmada en este bimestre.",
        });
      }
      return res.status(500).json({ error: "Error al registrar la inscripción." });
    }
  }
);

/**
 * GET /api/seleccionarGrupo/mio
 * Devolver la inscripción del alumno en el bimestre vigente
 */
router.get(
  "/mio",
  authenticateAlumno(true),
  cargarBimestreActual,
  async (req, res) => {
    try {
      const user = req.user || req.usuario;
      const alumnoId = user?.id || user?._id;
      const { bimestreNumero, bimestreTexto } = req.ctx || {};

      const eg = await EleccionGrupo.findOne({
        alumnoId,
        bimestre: bimestreNumero,
      }).lean();

      if (!eg) {
        return res.json({
          status: "none",
          bimestre: bimestreNumero,
          bimestreTexto,
        });
      }

      return res.json({
        status: "confirmed",
        bimestre: bimestreNumero,
        bimestreTexto,
        aula: {
          grupoId: String(eg.grupoId),
          nombreGrupo: eg.nombreGrupo,
          turno: eg.turno,
          bimestre: eg.bimestre,
          nombreHorario: eg.nombreHorario,
          curpProfesor: eg.curpProfesor,
        },
        eleccionId: String(eg._id),
      });
    } catch (err) {
      console.error("❌ Error en GET /mio:", err);
      return res.status(500).json({ error: "Error al consultar tu inscripción." });
    }
  }
);

module.exports = router;
