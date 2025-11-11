// routes/admin_principal/leerhorarios.js
// 📁 routes/admin_principal/leerhorarios.js
const express = require("express");
const router = express.Router();
const Horario = require("../../models_grupos/horarioModel");
const Grupo = require("../../models_grupos/grupoModel");
const User = require("../../models/User_admin_principal"); // ✅ Modelo correcto
const { validarLeerHorarios } = require("../../middlewares/admin_principal/leerhorarios");

// ✅ Función auxiliar para obtener el nombre del profesor por CURP desde el modelo User
const obtenerNombreProfesor = async (curp) => {
  const profesor = await User.findOne({ curp, role: "maestro", status: "active" });
  return profesor
    ? `${profesor.firstName} ${profesor.lastName}`
    : "Sin nombre";
};

// ✅ Endpoint para leer los horarios almacenados
router.get("/", validarLeerHorarios, async (req, res) => {
  console.log("📌 [API] Solicitud recibida para obtener horarios almacenados.");

  try {
    const totalHorarios = await Horario.countDocuments();
    console.log(`🔍 [DEBUG] Total de horarios en la base de datos: ${totalHorarios}`);

    if (totalHorarios === 0) {
      console.warn("⚠️ [ADVERTENCIA] No hay horarios almacenados en la base de datos.");
      return res.json([]);
    }

    const horarios = await Horario.find()
      .populate("grupoId", "_id nombre turno bimestre")
      .sort({ "grupoId.nombre": 1 });

    const respuesta = await Promise.all(horarios.map(async (horario) => {
      if (!horario.grupoId) {
        console.warn(`⚠️ [ADVERTENCIA] Horario con ID ${horario._id} no tiene un grupo asociado.`);
        return null;
      }

      const grupoId = horario.grupoId._id.toString();
      const grupoNombre = horario.grupoId.nombre;
      const turno = horario.grupoId.turno || "Sin Turno";
      const bimestre = horario.bimestre || horario.grupoId.bimestre || "?";
      const nombreHorario = horario.nombreHorario;

      const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      const bloques = horario.horario["Lunes"]?.map(b => b.hora) || [];

      const horarioOrdenado = await Promise.all(bloques.map(async (hora, idx) => {
        const diaMaterias = {};
        for (const dia of dias) {
          const clase = horario.horario[dia]?.[idx];
          const curp = clase?.curpProfesor || "N/A";
          const nombreProfesor = await obtenerNombreProfesor(curp);
          diaMaterias[dia] = {
            materia: clase?.materia || "-",
            nombreProfesor
          };
        }
        return [hora, diaMaterias];
      }));

      return {
        grupoId,
        grupo: grupoNombre,
        turno,
        bimestre,
        nombreHorario,
        horarioOrdenado
      };
    }));

    const horariosFiltrados = respuesta.filter(r => r !== null);

    console.log("✅ [API] Horarios obtenidos con éxito. Enviando respuesta...");
    res.json(horariosFiltrados);

  } catch (error) {
    console.error("❌ [ERROR] No se pudieron obtener los horarios:", error);
    res.status(500).json({ error: "Error al obtener los horarios." });
  }
});

module.exports = router;
