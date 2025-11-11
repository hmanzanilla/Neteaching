// models_grupos/grupoModel.js
const mongoose = require("mongoose");

const grupoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  turno: {
    type: String,
    enum: ["Matutino", "Vespertino", "Mixto"],
    required: true
  },
  bimestre: {
    type: Number, // 1, 2 o 3
    required: true
  },
  curpProfesor: { // 🔄 Cambio aquí
    type: String,
    required: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  admin_creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  }
});

const Grupo = mongoose.model("Grupo", grupoSchema);
module.exports = Grupo;
