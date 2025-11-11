// backend/routes/maestro/auth_maestro.js
console.log("🟢 auth_maestro.js cargado correctamente");

const express = require("express");
const bcryptjs = require("bcryptjs");
const router = express.Router();
const UserMaestro = require("../../models/User_maestro");
const authenticateMaestro = require("../../middlewares/maestro/auth_maestro");

// Helpers de cookies por rol
const { COOKIE_NAMES, cookieOptions } = require("../../utils/authCookies");

/**
 * 🔐 LOGIN DEL MAESTRO (con control de sesión única)
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
    }

    const user = await UserMaestro.findOne({ email: String(email).trim().toLowerCase(), role: "maestro" });
    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas o no es maestro." });
    }

    // Política de contraseña por rol (si no aplica, elimínala)
    if (!password.startsWith("Maestro_")) {
      return res.status(400).json({ message: "La contraseña debe comenzar con 'Maestro_'." });
    }

    const isMatch = await bcryptjs.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Cuenta inactiva. Contacte al soporte." });
    }

    // Sesión única: bloquea segundo login si ya está conectado
    if (user.estado === "conectado") {
      return res.status(403).json({ message: "Este usuario ya tiene una sesión activa." });
    }

    // Firma unificada { userId, role, email } (usa tu helper del modelo)
    const token = await user.generateAuthToken({ expiresIn: "2h" });
    user.estado = "conectado";
    if ("lastLogin" in user) user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Cookie httpOnly específica del rol maestro
    const PROD = (process.env.NODE_ENV || "development") === "production";
    res.cookie(COOKIE_NAMES.maestro, token, cookieOptions({ prod: PROD }));

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      userId: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      redirectUrl: "/maestro/ruta2",
    });
  } catch (error) {
    console.error("❌ [Login Maestro] Error:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/**
 * 🔒 LOGOUT del maestro (revoca si existe helper; siempre deja estado inactivo)
 */
router.post("/logout", authenticateMaestro, async (req, res) => {
  try {
    const u = req.user;
    if (!u) return res.status(200).json({ message: "Sesión cerrada." });

    // Si el modelo expone helpers de revocación, úsalos sin romper si no existen
    try {
      if (typeof u.revokeToken === "function") {
        await u.revokeToken();
      } else {
        u.estado = "inactivo";
        if ("token" in u) u.token = null;
        if ("tokenExpiresAt" in u) u.tokenExpiresAt = null;
        await u.save({ validateBeforeSave: false });
      }
    } catch (e) {
      // No romper logout por fallos de BD
      console.warn("⚠️ revokeToken/save falló:", e?.message || e);
    }

    // Limpiar cookie del rol
    res.clearCookie(COOKIE_NAMES.maestro, { path: "/" });

    return res.status(200).json({ message: "Sesión cerrada correctamente." });
  } catch (error) {
    console.error("❌ Error al cerrar sesión:", error);
    return res.status(200).json({ message: "Sesión cerrada." }); // logout nunca debe fallar
  }
});

/**
 * 🔎 Obtener datos del maestro autenticado
 */
router.get("/usuario", authenticateMaestro, async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ message: "Usuario no encontrado." });
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
});

/**
 * 🔐 Verificar token válido
 * - No volvemos a invocar helpers del modelo aquí (ya lo hizo el middleware).
 * - Si el middleware pasó, respondemos 200 con req.user.
 */
router.get("/verify-token", authenticateMaestro, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Token inválido o revocado." });
    }
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;

