// backend/routes/routers/router_admin_principal.js

const express = require("express");
const router = express.Router();

// 🔐 Autenticación del admin principal
router.use("/auth", require("../admin_principal/auth_admin_principal"));

// 👥 Gestión de usuarios
router.use("/users", require("../admin_principal/users"));
router.use("/status", require("../admin_principal/statusChange"));
router.use("/delete", require("../admin_principal/usersDelete"));

// 🧩 Grupos y horarios
router.use("/grupos", require("../admin_principal/grupos"));
router.use("/horarios", require("../admin_principal/horarios"));
router.use("/leerhorarios", require("../admin_principal/leerhorarios"));
router.use("/eliminarGrupo", require("../admin_principal/eliminarGrupo"));

// 🎥 Carga de videos y bimestres
router.use("/cargaVideos", require("../general/cargaVideos"));
router.use("/bimestre-actual", require("../general/bimestreActual"));

// 🟢 Estado de conexión
router.use("/", require("../marcarConectado"));

// 🔁 Logout (alias legacy)
router.use("/logout", require("../logout"));

// ✅ Health / readiness
router.get("/healthz", (_req, res) =>
  res.status(200).json({ ok: true, role: "admin_principal" })
);

module.exports = router;
