// backend/routes/alumno/auth_alumno.js
console.log("🟢 auth_alumno.js cargado correctamente");

const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserAlumno = require("../../models/User_alumno");
const checkEmail = require("../../middlewares/checkEmail");
const { sendWelcomeEmail } = require("../../config/mailer");
const authenticateAlumno = require("../../middlewares/alumno/auth_alumno");

// Cookies por rol
const { COOKIE_NAMES, cookieOptions } = require("../../utils/authCookies");

// ---- Helpers de error
const handleDuplicateKeyError = (error, res) => {
  const field = Object.keys(error.keyValue);
  res.status(409).send({ message: `El ${field} ya está registrado.` });
};
const handleValidationError = (error, res) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  res.status(400).send({ message: errors.join(" ") });
};

// ============================
// 👤 Registro de alumno
// ============================
router.post("/register", checkEmail, async (req, res) => {
  const {
    email,
    password,
    username,
    firstName,
    lastName,
    curp,
    phoneNumber,
    sex,
  } = req.body || {};

  if (!email || !password || !username || !firstName || !lastName || !curp || !phoneNumber || !sex) {
    return res.status(400).send({ message: "Todos los campos son requeridos." });
  }

  try {
    const hashedPassword = await bcryptjs.hash(String(password), 10);

    const user = new UserAlumno({
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      username,
      firstName,
      lastName,
      curp,
      phoneNumber,
      sex,
      role: "alumno",
      status: "pending",
      estado: "desconectado",
    });

    await user.save();
    try { await sendWelcomeEmail(user.email); } catch (_) {}

    return res
      .status(201)
      .send({ message: "Registro exitoso. Espere la validación del administrador." });
  } catch (error) {
    console.error("❌ Error al registrar alumno:", error);
    if (error.name === "MongoServerError" && error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    if (error.name === "ValidationError") {
      return handleValidationError(error, res);
    }
    return res.status(500).send({ message: "Error al registrar el usuario." });
  }
});

// ============================
// 🔐 Login de alumno
// ============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
    }

    const user = await UserAlumno.findOne({
      email: String(email).trim().toLowerCase(),
      role: "alumno",
    });
    if (!user) return res.status(401).json({ message: "Credenciales incorrectas." });

    if (user.estado === "conectado") {
      return res.status(403).json({ message: "Este usuario ya tiene una sesión activa." });
    }

    const ok = await bcryptjs.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ message: "Credenciales incorrectas." });

    // Firma unificada y control de sesión
    const token = await user.generateAuthToken({ expiresIn: "2h" });
    user.estado = "conectado";
    if ("lastLogin" in user) user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // ⚙️ Opciones de cookie (compatibles producción/dev)
    const PROD = (process.env.NODE_ENV || "development") === "production";
    const baseOpts = cookieOptions({ prod: PROD });
    const wideOpts = { ...baseOpts, path: "/" }; // ← alcance a todas las rutas del subservidor

    // 🍪 Cookie por rol (conserva tu comportamiento actual)
    res.cookie(COOKIE_NAMES.alumno, token, wideOpts);

    // 🍪 Cookie de COMPATIBILIDAD para rutas genéricas que leen `req.cookies.token`
    res.cookie("token", token, wideOpts);

    const redirectUrl = user.status === "pending" ? "/alumno" : "/alumno/conocenos";

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      role: user.role,
      status: user.status,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      haRealizadoPrueba: user.haRealizadoPrueba,
      redirectUrl,
    });
  } catch (error) {
    console.error("❌ Error en login alumno:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
});

// ============================
// 🔒 Logout
// ============================
router.post("/logout", authenticateAlumno(false), async (req, res) => {
  try {
    const u = req.user;
    if (!u) {
      // idempotente
      res.clearCookie(COOKIE_NAMES.alumno, { path: "/" });
      res.clearCookie("token", { path: "/" }); // ← limpiar compat
      return res.status(200).send({ message: "Sesión cerrada." });
    }

    try {
      if (typeof u.revokeToken === "function") {
        await u.revokeToken();
      } else {
        u.estado = "desconectado";
        if ("token" in u) u.token = null;
        if ("tokenExpiresAt" in u) u.tokenExpiresAt = null;
        await u.save({ validateBeforeSave: false });
      }
    } catch (e) {
      console.warn("⚠️ revokeToken/save falló:", e?.message || e);
    }

    res.clearCookie(COOKIE_NAMES.alumno, { path: "/" });
    res.clearCookie("token", { path: "/" }); // ← limpiar compat
    return res.status(200).send({ message: "Sesión cerrada exitosamente." });
  } catch (error) {
    console.error("❌ Error en logout alumno:", error);
    res.clearCookie(COOKIE_NAMES.alumno, { path: "/" });
    res.clearCookie("token", { path: "/" });
    return res.status(200).send({ message: "Sesión cerrada." });
  }
});

// ============================
// 👤 Usuario actual (no exige 'active')
// ============================
router.get("/usuario", authenticateAlumno(false), async (req, res) => {
  try {
    const user = await UserAlumno.findById(req.user._id).select("-password");
    if (!user) return res.status(404).send({ message: "Usuario no encontrado." });
    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    return res.status(500).send({ message: "Error en el servidor." });
  }
});

// ============================
// ✅ Verify token
// ============================
router.get("/verify-token", authenticateAlumno(false), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Token inválido o revocado." });
    }
    return res.status(200).json({
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      estado: req.user.estado,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      haRealizadoPrueba: req.user.haRealizadoPrueba,
    });
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

// ============================
// 🧪 Marcar prueba realizada
// ============================
router.post("/marcarPruebaRealizada", authenticateAlumno(false), async (req, res) => {
  try {
    const { userId } = req.body || {};
    const user = await UserAlumno.findById(userId);

    if (!user || user.role !== "alumno" || user.status !== "pending") {
      return res.status(403).json({ message: "No tienes permiso para realizar esta acción." });
    }

    if (user.haRealizadoPrueba) {
      return res.status(400).json({ message: "Ya has realizado la prueba." });
    }

    user.haRealizadoPrueba = true;
    user.status = "active";
    await user.save();

    return res.json({ message: "Prueba registrada exitosamente.", haRealizadoPrueba: true });
  } catch (error) {
    console.error("❌ Error al registrar la prueba:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;


