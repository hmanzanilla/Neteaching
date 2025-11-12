// backend/routes/routers/router_maestro.js

const express = require("express");
const router = express.Router();

// 🔐 Auth del maestro
router.use("/auth", require("../maestro/auth_maestro"));

// 🧑‍🏫 Crear Aulas
router.use("/crear-aulas", require("../maestro/crear_aulas"));

// 🧑‍🏫 Estado actual de aulas
router.use("/aulas", require("../maestro/aulas_estado"));

// 🟢 Estado de conexión
router.use("/", require("../marcarConectado"));

// 📷 Perfil / uploads compartidos
router.use("/perfil/upload", require("../general/fotosPerfil"));

// 📚 Lectura de grupos/horarios
router.use("/grupos", require("../general/leerGruposHorarios"));

// 📝 Registro (común)
router.use("/register", require("../register"));

// ✅ Health / readiness
router.get("/healthz", (_req, res) => res.status(200).json({ ok: true, role: "maestro" }));

module.exports = router;
