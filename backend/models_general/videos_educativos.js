// models_general/videos_educativos.js
const mongoose = require("mongoose");

const VideoEducativoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  nombreVideo: {
    type: String,
    required: false
  },
  categoria: {
    type: String,
    enum: [
      "Biología",
      "Física",
      "Matemáticas",
      "Química",
      "Historia",
      "Competencia Escrita",
      "Competencia Lectora",
      "Reading Comprehension"
    ],
    required: true
  },
  fechaSubida: {
    type: Date,
    default: Date.now
  }
});

VideoEducativoSchema.index({ categoria: 1, fechaSubida: -1 });

module.exports = mongoose.model("videos_educativos", VideoEducativoSchema);

