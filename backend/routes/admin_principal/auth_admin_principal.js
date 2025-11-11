// backend/routes/admin_principal/auth_admin_principal.js
const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const UserAdminPrincipal = require("../../models/User_admin_principal");
const { authenticate } = require("../../middlewares/admin_principal/auth_admin_principal");

// ⬇️ NUEVO: helpers para cookies por rol
const { COOKIE_NAMES, cookieOptions } = require("../../utils/authCookies");

// (Opcional) si usas correos de bienvenida
// const { sendWelcomeEmail } = require("../../config/mailer");

/**
 * 🔹 REGISTRO DEL ADMIN PRINCIPAL (único)
 * Nota: mantenlo protegido; normalmente solo permites 1 admin_principal.
 */
router.post("/register", async (req, res) => {
  const {
    email, password, username, firstName, lastName,
    curp, phoneNumber, sex, status
  } = req.body || {};

  try {
    // Solo puede existir uno
    const existingAdmin = await UserAdminPrincipal.findOne({ role: "admin_principal" });
    if (existingAdmin) {
      return res.status(403).json({ error: "Ya existe un administrador principal registrado." });
    }

    // Evita colisión por email
    const dup = await UserAdminPrincipal.findOne({ email });
    if (dup) {
      return res.status(409).json({ error: "Este correo ya está registrado." });
    }

    const newAdmin = new UserAdminPrincipal({
      email,
      password, // 🔐 se encripta en el pre('save') del modelo base
      username,
      firstName,
      lastName,
      curp,
      phoneNumber,
      sex: sex === "Masculino" ? "Masculino" : "Femenino",
      role: "admin_principal",
      status: status === "pending" ? "pending" : "active",
      estado: "inactivo",
      token: null,
      tokenExpiresAt: null,
    });

    await newAdmin.save();

    // (Opcional) enviar correo
    // try { await sendWelcomeEmail(email, firstName); } catch (_) {}

    return res.status(201).json({
      message: "Administrador principal registrado correctamente.",
      userId: newAdmin._id,
      role: newAdmin.role,
      redirectUrl: "/adminprincipal/ruta4",
    });
  } catch (error) {
    console.error("❌ [AdminP Register] Error:", error);
    return res.status(500).json({ error: "Error al registrar el administrador principal." });
  }
});

/**
 * ✅ LOGIN con sesión única + cookie httpOnly
 */
router.post("/login", async (req, res) => {
  const { email, password } = (req.body || {});

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    const user = await UserAdminPrincipal.findOne({ email, role: "admin_principal" });
    if (!user) {
      return res.status(400).json({ error: "Credenciales incorrectas." });
    }

    const ok = await bcryptjs.compare(String(password), user.password);
    if (!ok) {
      return res.status(400).json({ error: "Credenciales incorrectas." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ error: "Solo administradores activos pueden ingresar." });
    }

    // Sesión única
    if (user.estado === "conectado") {
      return res.status(403).json({ error: "Este usuario ya tiene una sesión activa." });
    }

    // Firma unificada + almacena token / expiración / heartbeat
    const token = await user.generateAuthToken({ expiresIn: "2h" });
    user.estado = "conectado";
    await user.save();

    // ⬇️ Cookie httpOnly **dedicada** al rol admin_principal
    res.cookie(
      COOKIE_NAMES.admin_principal,
      token,
      cookieOptions({ prod: process.env.NODE_ENV === "production" })
    );

    return res.status(200).json({
      message: "Inicio de sesión exitoso.",
      userId: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      redirectUrl: "/adminprincipal/ruta4",
    });
  } catch (error) {
    console.error("❌ [AdminP Login] Error:", error);
    return res.status(500).json({ error: "Error en el servidor." });
  }
});

/**
 * 🔐 VERIFY TOKEN (valida contra BD: revocación/exp)
 */
router.get("/verify-token", authenticate, async (req, res) => {
  try {
    // req.user y req.token vienen del middleware
    const user = await UserAdminPrincipal.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (typeof user.isTokenValid === "function") {
      if (!user.isTokenValid(req.token)) {
        return res.status(401).json({ message: "Token inválido, revocado o expirado." });
      }
    } else if (user.token !== req.token) {
      return res.status(401).json({ message: "Token inválido o revocado." });
    }

    // Opcional: actualizar heartbeat
    if (typeof user.touchHeartbeat === "function") {
      await user.touchHeartbeat();
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("❌ [AdminP VerifyToken] Error:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * ✅ LOGOUT: revoca token, marca inactivo y limpia cookie
 */
router.post("/logout", authenticate, async (req, res) => {
  try {
    // Usa helper del modelo para revocar
    if (typeof req.user.revokeToken === "function") {
      await req.user.revokeToken();
    } else {
      // fallback si el helper no existiera
      const u = await UserAdminPrincipal.findById(req.user._id);
      if (u) {
        u.token = null;
        u.tokenExpiresAt = null;
        u.estado = "inactivo";
        await u.save();
      }
    }

    // ⬇️ limpiar cookie **dedicada** del admin principal
    res.clearCookie(COOKIE_NAMES.admin_principal, { path: "/" });
    return res.status(200).json({ message: "Sesión cerrada correctamente." });
  } catch (error) {
    console.error("❌ [AdminP Logout] Error:", error);
    return res.status(500).json({ message: "Error al cerrar sesión." });
  }
});

module.exports = router;
