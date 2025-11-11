//c:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1.3.3\models_grupos\horarioModel.js
// models_grupos/horarioModel.js

const mongoose = require("mongoose");

// Esquema para una clase (materia + curp del profesor)
const claseSchema = new mongoose.Schema({
  hora: {
    type: String,
    required: true
  },
  materia: {
    type: String,
    required: true,
    trim: true
  },
  curpProfesor: { // 🔄 antes era profesorRFC
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// Esquema del horario semanal con múltiples bloques por día
const horarioSemanaSchema = new mongoose.Schema({
  Lunes: [claseSchema],
  Martes: [claseSchema],
  Miércoles: [claseSchema],
  Jueves: [claseSchema],
  Viernes: [claseSchema]
}, { _id: false });

const horarioSchema = new mongoose.Schema({
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grupo",
    required: true
  },
  nombreHorario: {
    type: String,
    required: true,
    trim: true
  },
  bimestre: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  horario: {
    type: horarioSemanaSchema,
    required: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  }
});

const Horario = mongoose.model("Horario", horarioSchema);
module.exports = Horario;
