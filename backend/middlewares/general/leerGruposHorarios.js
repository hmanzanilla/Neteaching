// 📁 middlewares/general/leerGruposHorarios.js
// 📁 middlewares/general/leerGruposHorarios.js

const BimestreActual = require("../../models_general/bimestreActualModel");
const Grupo = require("../../models_grupos/grupoModel");
const Horario = require("../../models_grupos/horarioModel");

module.exports = async (req, res) => {
  try {
    // 1. Obtener el bimestre actual más reciente
    const bimestreDoc = await BimestreActual.findOne().sort({ fechaActualizacion: -1 });

    if (!bimestreDoc) {
      return res.status(404).json({ error: "No se ha establecido el bimestre actual." });
    }

    const mapaBimestre = {
      "Primer Bimestre": 1,
      "Segundo Bimestre": 2,
      "Tercer Bimestre": 3,
    };

    const bimestreTexto = bimestreDoc.bimestre;
    const bimestreNumero = mapaBimestre[bimestreTexto];

    if (!bimestreNumero) {
      return res.status(400).json({ error: "Formato de bimestre inválido." });
    }

    // 2. Buscar grupos del bimestre actual
    const grupos = await Grupo.find({ bimestre: bimestreNumero });
    if (grupos.length === 0) {
      return res.status(404).json({ error: "No hay grupos para este bimestre." });
    }

    // 3. Buscar horarios que coincidan con los grupos y el bimestre
    const grupoIds = grupos.map(g => g._id);
    const horarios = await Horario.find({
      grupoId: { $in: grupoIds },
      bimestre: bimestreNumero,
    });

    // 4. Preparar estructura para enviar al frontend
    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    const resultado = grupos.map(grupo => {
      const horario = horarios.find(
        h =>
          h.grupoId.toString() === grupo._id.toString() &&
          h.bimestre === grupo.bimestre
      );

      if (!horario) {
        console.warn(`⚠️ Grupo sin horario: ${grupo.nombre} (ID: ${grupo._id})`);
        return null;
      }

      const horasSet = new Set();
      dias.forEach(dia => {
        (horario.horario[dia] || []).forEach(clase => horasSet.add(clase.hora));
      });
      const horasOrdenadas = Array.from(horasSet).sort();

      const horarioOrdenado = horasOrdenadas.map(hora => {
        const bloque = {};
        dias.forEach(dia => {
          const clase = (horario.horario[dia] || []).find(c => c.hora === hora);
          bloque[dia] = { materia: clase?.materia || "" };
        });
        return [hora, bloque];
      });

      return {
        grupoId: grupo._id,
        nombre: grupo.nombre,
        turno: grupo.turno,
        bimestre: grupo.bimestre,
        nombreHorario: horario.nombreHorario,
        horarioOrdenado,
      };
    }).filter(Boolean); // Elimina los grupos sin horario

    res.json(resultado);
  } catch (error) {
    console.error("❌ Error en leerGruposHorarios:", error);
    res.status(500).json({ error: "Error al obtener los grupos y horarios." });
  }
};
