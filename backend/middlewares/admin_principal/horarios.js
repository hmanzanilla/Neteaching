const Grupo = require('../../models_grupos/grupoModel');

const validarHorario = async (req, res, next) => {
  try {
    const { grupoId, nombreHorario, bimestre, horario } = req.body;

    if (!grupoId || !nombreHorario || !bimestre || !horario) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    const grupo = await Grupo.findById(grupoId);
    if (!grupo) {
      return res.status(404).json({ mensaje: "El grupo no existe." });
    }

    if (grupo.bimestre !== bimestre) {
      return res.status(400).json({ mensaje: "El bimestre no coincide con el del grupo." });
    }

    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    for (const dia of dias) {
      const clases = horario[dia];

      if (!Array.isArray(clases) || clases.length === 0) {
        return res.status(400).json({ mensaje: `El día ${dia} debe tener al menos un bloque.` });
      }

      for (const clase of clases) {
        if (!clase.hora || !clase.materia || !clase.curpProfesor) { // 🔄 CAMBIO AQUÍ
          return res.status(400).json({ mensaje: `Faltan datos en una clase del día ${dia}.` });
        }
      }
    }

    next();
  } catch (error) {
    console.error("❌ Error en validación de horario:", error);
    return res.status(500).json({ mensaje: "Error interno en la validación del horario." });
  }
};

module.exports = {
  validarHorario
};
