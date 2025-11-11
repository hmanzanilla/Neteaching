// routes/general/cargaVideos.js
const express = require("express");
const router = express.Router();
const VideoEducativo = require("../../models_general/videos_educativos");
const validaCargaVideos = require("../../middlewares/general/cargaVideos"); // Middleware actualizado

// POST /api/videos - Guarda un nuevo video educativo
router.post("/", validaCargaVideos, async (req, res) => {
  console.log("Body recibido en cargar videos:", req.body);
  try {
    const { url, categoria, nombreVideo } = req.body;
    
    if(!url || !categoria){
      return res.status(400).json({message: "Faltan campos obligatorios."});
    }
    const nuevoVideo = new VideoEducativo({
      url,
      categoria,
      nombreVideo: nombreVideo || "" // opcional
    });

    await nuevoVideo.save();
    res.status(201).json({ message: "Video guardado correctamente.", video: nuevoVideo });
  } catch (error) {
    console.error("❌ Error al guardar el video:", error.message);
    res.status(500).json({ message: "Error interno al guardar el video." });
  }
});

module.exports = router;
