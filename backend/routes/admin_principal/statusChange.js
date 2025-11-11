const express = require("express");
const router = express.Router();
const { authenticate } = require("../../middlewares/admin_principal/auth_admin_principal");

// Importar modelos de usuario por rol
const UserAdminPrincipal = require("../../models/User_admin_principal");
const UserAlumno = require("../../models/User_alumno");
const UserMaestro = require("../../models/User_maestro");
const UserAdministrador = require("../../models/User_admin");

// ✅ Ruta para cambiar el estado de un usuario
router.put("/:userId", authenticate, async (req, res) => {
    console.log("📥 [DEBUG] Solicitud de actualización de estado recibida...");

    const { userId } = req.params;
    const { status } = req.body;

    try {
        let user = null;
        let model = null;

        // Buscar el usuario en los modelos disponibles
        const searchOrder = [
            { model: UserAlumno, name: "alumno" },
            { model: UserMaestro, name: "maestro" },
            { model: UserAdministrador, name: "administrador" },
            { model: UserAdminPrincipal, name: "admin_principal" },
        ];

        for (const entry of searchOrder) {
            user = await entry.model.findById(userId);
            if (user) {
                model = entry;
                break;
            }
        }

        if (!user) {
            console.log("❌ [ERROR] Usuario no encontrado en ningún modelo.");
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        console.log(`👤 [DEBUG] Usuario encontrado con rol: ${model.name}, status actual: ${user.status}`);

        // 🚫 No permitir cambiar el estado del admin principal
        if (model.name === "admin_principal") {
            console.warn("⛔ No se puede modificar el estado del administrador principal.");
            return res.status(403).json({ error: "No se puede modificar el estado del administrador principal" });
        }

        // Actualizar estado
        user.status = status;
        await user.save();
        console.log(`✅ [DEBUG] Estado actualizado a: ${status}`);

        res.status(200).json({ message: "Estado actualizado correctamente" });

    } catch (error) {
        console.error("❌ [ERROR] Fallo al actualizar estado:", error);
        res.status(500).json({ error: "Error al actualizar estado del usuario" });
    }
});

module.exports = router;