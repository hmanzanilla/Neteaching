const express = require("express");
const router = express.Router();
const { authenticate } = require("../../middlewares/admin_principal/auth_admin_principal");

// Importar modelos por rol
const UserAdminPrincipal = require("../../models/User_admin_principal");
const UserAlumno = require("../../models/User_alumno");
const UserMaestro = require("../../models/User_maestro");
const UserAdministrador = require("../../models/User_admin");

// ✅ Ruta para eliminar un usuario (excepto admin_principal)
router.delete("/:userId", authenticate, async (req, res) => {
    console.log("📥 [DEBUG] Solicitud de eliminación de usuario recibida...");

    const { userId } = req.params;
    console.log(`🔍 [DEBUG] userId recibido para eliminar: ${userId}`);

    try {
        let user = null;
        let model = null;

        // 🔎 Buscar usuario en cada modelo
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

        console.log(`👤 [DEBUG] Usuario encontrado con rol: ${model.name}, email: ${user.email}`);

        // 🔒 Prevenir eliminación de admin_principal
        if (model.name === "admin_principal") {
            console.log("❌ [ERROR] No se puede eliminar al administrador principal.");
            return res.status(403).json({ error: "No se puede eliminar al administrador principal" });
        }

        // 🗑️ Eliminar del modelo correspondiente
        await model.model.findByIdAndDelete(userId);
        console.log(`✅ [DEBUG] Usuario eliminado correctamente.`);

        res.status(200).json({ message: "Usuario eliminado correctamente" });

    } catch (error) {
        console.error("❌ [ERROR] Fallo al eliminar usuario:", error);
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

module.exports = router;