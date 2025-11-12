// backend/routes/login_unificado.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Modelos por rol
const roles = [
  { role: "alumno",          model: require("../models/User_alumno") },
  { role: "maestro",         model: require("../models/User_maestro") },
  { role: "administrador",   model: require("../models/User_admin") },
  { role: "admin_principal", model: require("../models/User_admin_principal") },
];

// Utilidades de cookies por rol
const { COOKIE_NAMES, cookieOptions } = require("../utils/authCookies");

/**
 * Opciones para "limpiar" cookies con los mismos flags con que se setean,
 * evitando que alguna quede pegada al cambiar sameSite/secure/domain.
 * (Si defines COOKIE_DOMAIN / COOKIE_SAMESITE / COOKIE_SECURE en .env,
 *  esto las respeta igual que cookieOptions).
 */
function buildClearOpts() {
  const prod = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const opts = cookieOptions({ prod }); // usa la misma base que al setear
  const base = {
    path: opts.path ?? "/",
    sameSite: opts.sameSite,
    secure: opts.secure,
    httpOnly: true,
  };
  const withDomain = process.env.COOKIE_DOMAIN
    ? { ...base, domain: process.env.COOKIE_DOMAIN }
    : null;
  return { base, withDomain };
}

// ✅ Ruta corregida: ahora es POST /
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios." });
    }
    if (!process.env.JWT_SECRET) {
      console.error("⚠ JWT_SECRET no definido");
      return res.status(500).json({ message: "Configuración faltante del servidor (JWT_SECRET)." });
    }

    const emailNorm = String(email).trim().toLowerCase();

    let algunUsuarioEncontrado = false;
    let usuarioContrasenaOK = null;
    let rolContrasenaOK = null;

    // 1️⃣ Buscar en todos los roles y validar contraseña
    for (const { role, model } of roles) {
      const user = await model.findOne({ email: emailNorm });
      if (!user) continue;

      algunUsuarioEncontrado = true;

      const ok = await bcrypt.compare(String(password), user.password);
      if (!ok) continue;

      // Estado de cuenta permitido
      if (user.status !== "active" && user.status !== "pending") {
        return res.status(403).json({ message: "Cuenta inactiva. Contacta al soporte." });
      }

      // Sesión única
      if (user.estado === "conectado") {
        return res.status(403).json({ message: "Este usuario ya tiene una sesión activa." });
      }

      usuarioContrasenaOK = user;
      rolContrasenaOK = role;
      break;
    }

    if (!usuarioContrasenaOK) {
      return res.status(401).json({
        message: algunUsuarioEncontrado
          ? "Credenciales inválidas."
          : "Correo o contraseña incorrectos.",
      });
    }

    // 2️⃣ Generar token y marcar conectado
    const user = usuarioContrasenaOK;
    const role = rolContrasenaOK;
    const token = await user.generateAuthToken({ expiresIn: "2h" });

    user.estado = "conectado";
    if ("lastLogin" in user) user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 3️⃣ Setear cookie httpOnly específica por rol
    const PROD = (process.env.NODE_ENV || "development") === "production";
    const cookieName = COOKIE_NAMES[role];
    res.cookie(cookieName, token, cookieOptions({ prod: PROD }));

    // Limpia cookies viejas o de otros roles
    const clearOpts = buildClearOpts();
    res.clearCookie("token", clearOpts.base);
    if (clearOpts.withDomain) res.clearCookie("token", clearOpts.withDomain);
    for (const [r, name] of Object.entries(COOKIE_NAMES)) {
      if (r !== role) {
        res.clearCookie(name, clearOpts.base);
        if (clearOpts.withDomain) res.clearCookie(name, clearOpts.withDomain);
      }
    }

    // 4️⃣ Redirección según rol
    let redirectUrl = "/";
    switch (role) {
      case "alumno":
        redirectUrl = user.status === "pending" ? "/alumno" : "/alumno/acceso";
        break;
      case "maestro":
        redirectUrl = "/maestro/ruta2";
        break;
      case "administrador":
        redirectUrl = "/administrador/ruta3";
        break;
      case "admin_principal":
        redirectUrl = "/adminprincipal/ruta4";
        break;
    }

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      role,
      redirectUrl,
      token,
      userId: user._id,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ [/api/login_unificado] Error:", err);
    return res.status(500).json({ message: "Error interno al iniciar sesión." });
  }
});

module.exports = router;



