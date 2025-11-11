// routes/general/leerBimestre.js
const express = require("express");
const router = express.Router();
const leerBimestre = require("../../middlewares/general/leerBimestre");

// Solo alumnos y maestros pueden acceder
router.get("/", leerBimestre(['alumno', 'maestro']), (req, res) => {
  console.log("📤 Enviando bimestre al frontend:");
  console.log("   🔹 Bimestre leído:", req.bimestreActual);
  console.log("   🔹 Petición desde IP:", req.ip);

  res.json({ bimestre: req.bimestreActual });
});

module.exports = router;
