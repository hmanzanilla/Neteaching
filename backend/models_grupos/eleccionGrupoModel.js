//c:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_OC_1\models_grupos\eleccionGrupoModel.js
// models_grupos/eleccionGrupoModel.js
const mongoose = require("mongoose");

const eleccionGrupoSchema = new mongoose.Schema({
  alumnoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario", // o "Alumno", si tienes un modelo distinto
    required: true
  },
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grupo",
    required: true
  },
  nombreGrupo: {
    type: String,
    required: true
  },
  nombreHorario: {
    type: String,
    required: true
  },
  bimestre: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  turno: {
    type: String,
    enum: ["Matutino", "Vespertino", "Mixto"],
    required: true
  },
  intentos: {
    type: Number,
    default: 1 // cada intento cuenta
  },
  fechaEleccion: {
    type: Date,
    default: Date.now
  }
});

const EleccionGrupo = mongoose.model("EleccionGrupo", eleccionGrupoSchema);
module.exports = EleccionGrupo;

