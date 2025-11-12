// backend/routes/routers/router_alumno.js
const express = require("express");
const router = express.Router();

// 🔐 Autenticación y registro
router.use("/auth", require("../alumno/auth_alumno"));
router.use("/auth_pruebas", require("../alumno/auth_alumno_pruebas"));
router.use("/suscripcion", require("../alumno/auth_suscripcion"));
router.use("/suscripcion/verificar", require("../alumno/verificar_suscripcion"));
router.use("/seleccionarGrupo", require("../alumno/seleccionarGrupo"));

// 📚 Contenido general
router.use("/videosAlumno", require("../general/leerVideos"));
router.use("/leerBimestre", require("../general/leerBimestre"));
router.use("/leerGruposHorarios", require("../general/leerGruposHorarios"));
router.use("/perfil/upload", require("../general/fotosPerfil"));

// 🧮 Simuladores y utilidades
router.use("/simuladores", require("../simuladores/index"));
router.use("/logout", require("../logout"));
router.use("/register", require("../register"));
router.use("/marcarConectado", require("../marcarConectado"));

module.exports = router;
