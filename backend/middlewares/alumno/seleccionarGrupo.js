// middlewares/alumno/seleccionarGrupo.js
// middlewares/alumno/seleccionarGrupo.js
// Middleware de validación para la API de selección/inscripción de grupo del alumno

const EleccionGrupo = require("../../ModelAulas/eleccionGrupoModel");
const Grupo = require("../../models_grupos/grupoModel");
const Horario = require("../../models_grupos/horarioModel");
const BimestreActual = require("../../models_general/bimestreActualModel");

// Mapa consistente texto → número
const MAPA_BIMESTRE = {
  "Primer Bimestre": 1,
  "Segundo Bimestre": 2,
  "Tercer Bimestre": 3,
};

/**
 * Lee el bimestre actual desde la colección de configuración
 * y lo adjunta como número en req.ctx.bimestreNumero.
 * Útil para POST /api/seleccionarGrupo y GET /api/seleccionarGrupo/mio
 */
const cargarBimestreActual = async (req, res, next) => {
  try {
    const bimestreDoc = await BimestreActual.findOne().sort({
      fechaActualizacion: -1,
    });

    if (!bimestreDoc) {
      return res
        .status(404)
        .json({ error: "No se ha establecido el bimestre actual." });
    }

    const bimestreTexto = bimestreDoc.bimestre;
    const bimestreNumero = MAPA_BIMESTRE[bimestreTexto];

    if (!bimestreNumero) {
      return res
        .status(400)
        .json({ error: "Formato de bimestre inválido en configuración." });
    }

    req.ctx = req.ctx || {};
    req.ctx.bimestreNumero = bimestreNumero;
    req.ctx.bimestreTexto = bimestreTexto;
    return next();
  } catch (err) {
    console.error("❌ Error en cargarBimestreActual:", err);
    return res
      .status(500)
      .json({ error: "Error al leer el bimestre actual." });
  }
};

/**
 * Valida la solicitud de inscripción del alumno:
 * - Requiere auth previa (req.user)
 * - Body: { grupoId }
 * - Verifica que el grupo exista y pertenezca al bimestre vigente
 * - Verifica que exista un horario para ese grupo y bimestre
 * - Garantiza que el alumno NO tenga ya inscripción en ese bimestre
 * Deja preparado el contexto para el handler final en req.ctx
 */
const validarSeleccionGrupo = async (req, res, next) => {
  try {
    // Autenticación previa (authenticateAlumno) debe haber poblado req.user
    const user = req.user || req.usuario; // compat
    const alumnoId = user?.id || user?._id;
    const role = user?.role;

    if (!alumnoId || role !== "alumno") {
      return res
        .status(401)
        .json({ error: "Autenticación requerida como alumno." });
    }

    const { grupoId } = req.body || {};
    if (!grupoId) {
      return res.status(400).json({ error: "Falta el 'grupoId' en el cuerpo." });
    }

    // Bimestre debe venir del middleware cargarBimestreActual
    const bimestreNumero = req.ctx?.bimestreNumero;
    if (!bimestreNumero) {
      return res
        .status(500)
        .json({ error: "Contexto de bimestre no disponible." });
    }

    // 1) Verificar existencia del grupo y coherencia con el bimestre vigente
    const grupoDoc = await Grupo.findById(grupoId).lean();
    if (!grupoDoc) {
      return res.status(404).json({ error: "Grupo no encontrado." });
    }
    if (grupoDoc.bimestre !== bimestreNumero) {
      return res.status(409).json({
        error:
          "El grupo no corresponde al bimestre vigente. Actualiza la página o elige otro grupo.",
      });
    }

    // 2) Verificar que exista un horario para ese grupo y bimestre
    const horarioDoc = await Horario.findOne({
      grupoId,
      bimestre: bimestreNumero,
    }).lean();

    if (!horarioDoc) {
      return res
        .status(404)
        .json({ error: "No hay horario definido para este grupo." });
    }

    // 3) Regla de unicidad: un alumno = un grupo por bimestre
    const yaInscrito = await EleccionGrupo.findOne({
      alumnoId,
      bimestre: bimestreNumero,
    }).lean();

    if (yaInscrito) {
      return res.status(409).json({
        error:
          "Ya tienes una inscripción confirmada en este bimestre.",
      });
    }

    // 4) Adjuntar contexto para el handler final
    req.ctx = req.ctx || {};
    req.ctx.alumnoId = alumnoId;
    req.ctx.grupoDoc = grupoDoc;
    req.ctx.horarioDoc = horarioDoc;

    return next();
  } catch (err) {
    console.error("❌ Error en validarSeleccionGrupo:", err);
    return res
      .status(500)
      .json({ error: "Error al validar la selección de grupo." });
  }
};

module.exports = {
  cargarBimestreActual,
  validarSeleccionGrupo,
};
