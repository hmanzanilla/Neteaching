// routes/marcarConectado.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Modelos por rol
const Alumno = require("../models/User_alumno");
const Maestro = require("../models/User_maestro");
const Administrador = require("../models/User_admin");
const AdminPrincipal = require("../models/User_admin_principal");

// ⬇️ NUEVO: utilidades para leer token desde cualquiera de las cookies de rol o Bearer
const { COOKIE_NAMES, getTokenFromReq } = require("../utils/authCookies");

router.post("/marcar-conectado", async (req, res) => {
  try {
    // 1) Leer token: prioriza la cookie del rol según el mount path, pero acepta cualquiera
    let preferName = null;
    // req.baseUrl será, por ejemplo, "/api/maestro" o "/api/administrador" si montas el router en esas rutas
    if (req.baseUrl?.includes("/api/maestro")) {
      preferName = COOKIE_NAMES.maestro;
    } else if (req.baseUrl?.includes("/api/administrador")) {
      preferName = COOKIE_NAMES.administrador;
    } else if (req.baseUrl?.includes("/api/admin_principal")) {
      preferName = COOKIE_NAMES.admin_principal;
    } else if (req.baseUrl?.includes("/api/alumno")) {
      preferName = COOKIE_NAMES.alumno;
    }

    const { token, from } = getTokenFromReq(req, preferName);
    if (!token) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    // 2) Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_e) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    // Soporte para payloads viejos y nuevos
    const userId = decoded.userId || decoded._id || decoded.id;
    const role = decoded.role;
    if (!userId || !role) {
      return res.status(400).json({ message: "Token sin userId o rol" });
    }

    // 3) Seleccionar el modelo por rol
    let Modelo = null;
    switch (role) {
      case "alumno":
        Modelo = Alumno; break;
      case "maestro":
        Modelo = Maestro; break;
      case "administrador":
        Modelo = Administrador; break;
      case "admin_principal":
        Modelo = AdminPrincipal; break;
      default:
        return res.status(400).json({ message: "Rol desconocido" });
    }

    // 4) Buscar usuario y actualizar estado
    const usuario = await Modelo.findById(userId);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si tu modelo tiene helper de validación de token, úsalo
    if (typeof usuario.isTokenValid === "function" && !usuario.isTokenValid(token)) {
      return res.status(403).json({ message: "Token revocado o expirado" });
    }

    // Mantener enum correcto: "inactivo" | "conectado"
    if (usuario.estado !== "conectado") {
      usuario.estado = "conectado";
    }

    // Opcional: heartbeat si existe
    if (typeof usuario.touchHeartbeat === "function") {
      await usuario.touchHeartbeat();
    } else {
      // sin helper, al menos guarda el cambio de estado
      await usuario.save();
    }

    console.log(`✅ Usuario ${usuario.email} (${role}) marcado como conectado (cookie=${from || "?"})`);
    return res.status(200).json({ message: "Usuario marcado como conectado" });
  } catch (error) {
    console.error("❌ Error al marcar como conectado:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

module.exports = router;

