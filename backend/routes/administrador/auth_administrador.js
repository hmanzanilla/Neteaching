// backend/routes/administrador/auth_administrador.js
console.log("🟢 auth_administrador.js cargado correctamente");

const express = require("express");
const bcryptjs = require("bcryptjs");
const router = express.Router();

const UserAdministrador = require("../../models/User_admin");
const authenticateAdministrador = require("../../middlewares/administrador/auth_administrador");

// ⬇️ helpers unificados de cookies por rol
const { COOKIE_NAMES, cookieOptions } = require("../../utils/authCookies");

/**
 * 🔐 LOGIN ADMINISTRADOR (con control de sesión única)
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
    }

    const user = await UserAdministrador.findOne({ email, role: "administrador" });
    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas o no es administrador." });
    }

    // Política de contraseña por rol (paralela al maestro)
    if (!password.startsWith("Administrador_")) {
      return res.status(400).json({ message: "La contraseña debe comenzar con 'Administrador_'." });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    // Estado de negocio
    if (user.status !== "active") {
      return res.status(403).json({ message: "Cuenta inactiva. Contacte al soporte." });
    }

    // Sesión única (mismo criterio que maestro)
    if (user.estado === "conectado") {
      return res.status(403).json({ message: "Este usuario ya tiene una sesión activa." });
    }

    // Firma unificada { userId, role, email } y registra expiración/heartbeat en el modelo
    const token = await user.generateAuthToken({ expiresIn: "2h" });
    user.estado = "conectado";
    await user.save();

    // ⬇️ cookie httpOnly específica del rol administrador
    const PROD = (process.env.NODE_ENV || "development") === "production";
    res.cookie(COOKIE_NAMES.administrador, token, cookieOptions({ prod: PROD }));
    // (opcional) limpiar cookie genérica antigua:
    // res.clearCookie("token", { path: "/" });

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      userId: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      redirectUrl: "/administrador/ruta3",
    });
  } catch (error) {
    console.error("❌ [Login Administrador] Error:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/**
 * 🔒 LOGOUT (revoca token y cambia estado)
 */
router.post("/logout", authenticateAdministrador, async (req, res) => {
  try {
    await req.user.revokeToken(); // limpia token, tokenExpiresAt y estado
    res.clearCookie(COOKIE_NAMES.administrador, { path: "/" });
    // res.clearCookie("token", { path: "/" }); // si aún existiera la genérica
    return res.status(200).json({ message: "Sesión cerrada correctamente." });
  } catch (error) {
    console.error("❌ Error al cerrar sesión (admin):", error);
    return res.status(500).json({ message: "Error interno al cerrar sesión." });
  }
});

/**
 * 👤 USUARIO autenticado
 */
router.get("/usuario", authenticateAdministrador, async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ message: "Usuario no encontrado." });
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("❌ Error al obtener usuario (admin):", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
});

/**
 * ✅ VERIFY-TOKEN (contra BD / revocación / expiración)
 */
router.get("/verify-token", authenticateAdministrador, async (req, res) => {
  try {
    if (!req.user || !req.user.isTokenValid(req.token)) {
      return res.status(401).json({ message: "Token inválido o revocado." });
    }
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("❌ Error al verificar token (admin):", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;
