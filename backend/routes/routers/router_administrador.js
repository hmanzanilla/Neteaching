// backend/routes/routers/router_administrador.js

const express = require("express");
const router = express.Router();

// 🔐 Auth del administrador (login, logout, verify-token, etc.)
router.use("/auth", require("../administrador/auth_administrador"));

// 🗂️ Crear Aulas
router.use("/crear-aulas", require("../administrador/crear_aulas"));

// 📡 Estado actual de aulas
router.use("/aulas", require("../administrador/aulas_estado"));

// 🟢 Estado de conexión
router.use("/", require("../marcarConectado"));

// 📝 Registro (común)
router.use("/register", require("../register"));

// 📷 Perfil / uploads compartidos
router.use("/perfil", require("../general/fotosPerfil"));

// 📚 Lectura de grupos/horarios
router.use("/grupos", require("../general/leerGruposHorarios"));

// 🔁 Logout (compatibilidad con front)
router.use("/logout", require("../logout"));

// ✅ Health / readiness
router.get("/healthz", (_req, res) =>
  res.status(200).json({ ok: true, role: "administrador" })
);

module.exports = router;
