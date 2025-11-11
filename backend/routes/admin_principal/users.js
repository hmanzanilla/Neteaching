// routes/admin_principal/users.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../../middlewares/admin_principal/auth_admin_principal");

// Importar los modelos de todos los roles
const UserAdminPrincipal = require("../../models/User_admin_principal");
const UserAlumno = require("../../models/User_alumno");
const UserMaestro = require("../../models/User_maestro");
const UserAdministrador = require("../../models/User_admin");

// ✅ Obtener todos los usuarios (solo admin principal puede acceder)
router.get("/", authenticate, async (req, res) => {
    console.log("📥 [DEBUG] Solicitud para obtener lista de usuarios recibida...");

    try {
        const alumnos = await UserAlumno.find({}, "-password");
        const maestros = await UserMaestro.find({}, "-password");
        const administradores = await UserAdministrador.find({}, "-password");
        const adminPrincipal = await UserAdminPrincipal.find({}, "-password");

        const allUsers = [
            ...alumnos.map(u => ({ ...u.toObject(), role: "alumno" })),
            ...maestros.map(u => ({ ...u.toObject(), role: "maestro" })),
            ...administradores.map(u => ({ ...u.toObject(), role: "administrador" })),
            ...adminPrincipal.map(u => ({ ...u.toObject(), role: "admin_principal" })),
        ];

        console.log(`✅ [DEBUG] Total usuarios encontrados: ${allUsers.length}`);
        res.status(200).json(allUsers);
    } catch (error) {
        console.error("❌ [ERROR] Fallo al obtener usuarios:", error);
        res.status(500).json({ error: "Error al obtener la lista de usuarios" });
    }
});

module.exports = router;