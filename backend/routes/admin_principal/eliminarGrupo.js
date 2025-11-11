// routes/admin_principal/eliminarGrupo.js
const express = require("express");
const router = express.Router();
const Grupo = require("../../models_grupos/grupoModel");
const Horario = require("../../models_grupos/horarioModel");
const { validarEliminarGrupo } = require("../../middlewares/admin_principal/eliminarGrupo");

router.delete("/:grupoId", validarEliminarGrupo, async (req, res) => {
  const { grupoId } = req.params;

  try {
    console.log(`📌 [API] Solicitud para eliminar grupo: ${grupoId}`);

    const grupoExistente = await Grupo.findById(grupoId);
    if (!grupoExistente) {
      console.warn(`⚠️ Grupo con ID ${grupoId} no encontrado.`);
      return res.status(404).json({ error: "Grupo no encontrado." });
    }

    const resultadoHorarios = await Horario.deleteMany({ grupoId });
    console.log(`🗑️ Eliminados ${resultadoHorarios.deletedCount} horarios del grupo.`);

    const resultadoGrupo = await Grupo.findByIdAndDelete(grupoId);
    console.log(`✅ Grupo eliminado: ${resultadoGrupo.nombre}`);

    res.json({ mensaje: `Grupo '${resultadoGrupo.nombre}' eliminado con sus horarios.` });
  } catch (error) {
    console.error("❌ Error al eliminar el grupo:", error);
    res.status(500).json({ error: "Error interno al eliminar el grupo." });
  }
});

module.exports = router;
