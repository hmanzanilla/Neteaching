// routes/general/leerVideos.js
const express = require("express");
const router = express.Router();
const VideoEducativo = require("../../models_general/videos_educativos");
const validaLeerVideos = require("../../middlewares/general/leerVideos"); // Middleware de validación

// GET /api/videosAlumno - Obtener todos los videos o filtrar por categoría
router.get("/", validaLeerVideos, async (req, res) => {
  try {
    const { categoria } = req.query; // Recibe categoría como parámetro opcional

    let filtros = {};
    if (categoria) {
      filtros.categoria = new RegExp(`^${categoria.trim()}$`, "i" );
    }

    const videos = await VideoEducativo.find(filtros).sort({ fechaSubida: -1 }); // Más recientes primero

    res.status(200).json(videos);
  } catch (error) {
    console.error("❌ Error al leer los videos:", error.message);
    res.status(500).json({ message: "Error interno al obtener los videos." });
  }
});

module.exports = router;
