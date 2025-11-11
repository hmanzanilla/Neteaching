//c:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1.3.3\models_pruebas\pruebasModel.js
const mongoose = require("mongoose");

const pruebaSchema = new mongoose.Schema({
  alumnoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alumno", // Hace referencia a la colección de alumnos
    required: true,
  },
  pruebaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cuestionario", // Hace referencia a la prueba/cuestionario realizado
    required: true,
  },
  fechaRealizacion: {
    type: Date,
    default: Date.now, // Registra la fecha automática
  },
  calificacion: {
    type: Number,
    required: true,
    min: 0, 
    max: 100, // Supongamos que la calificación es de 0 a 100
  },
  intentos: {
    type: Number,
    default: 1, // Se puede modificar si el alumno tiene múltiples intentos
  },
  respuestas: {
    type: Array, // Guarda respuestas individuales si es necesario
    default: [],
  },
  tiempoTotal: {
    type: Number, // Tiempo en segundos que tomó completar la prueba
    required: true,
  },
});

module.exports = mongoose.model("Prueba", pruebaSchema);
