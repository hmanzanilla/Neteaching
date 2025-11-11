// models_grupos/profesorModel.js

const mongoose = require("mongoose");

const profesorSchema = new mongoose.Schema({
  curp: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellidoPaterno: {
    type: String,
    required: true,
    trim: true
  },
  apellidoMaterno: {
    type: String,
    required: false,
    trim: true
  },
  correo: {
    type: String,
    required: false,
    trim: true
  },
  telefono: {
    type: String,
    required: false,
    trim: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  }
});

const Profesor = mongoose.model("Profesor", profesorSchema);
module.exports = Profesor;
