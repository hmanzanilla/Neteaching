// 📁 routes/general/leerGruposHorarios.js
const express = require("express");
const router = express.Router();
const leerGruposHorarios = require("../../middlewares/general/leerGruposHorarios");

router.get("/", leerGruposHorarios);

module.exports = router;
