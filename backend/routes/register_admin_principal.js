// backend/routes/register_admin_principal.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminPrincipal = require("../models/User_admin_principal");

router.post("/register-admin-principal", async (req, res) => {
  try {
    const {
      email,
      password,
      username,
      firstName,
      lastName,
      curp,
      phoneNumber,
      sex
    } = req.body;

    // Verificar si el correo ya está registrado
    const yaExiste = await AdminPrincipal.findOne({ email });
    if (yaExiste) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo admin principal
    const nuevoAdmin = new AdminPrincipal({
      email,
      password: hashedPassword,
      username,
      firstName,
      lastName,
      curp,
      phoneNumber,
      sex,
      role: "admin_principal",
      status: "active"
    });

    // Generar token JWT
    const token = jwt.sign(
      {
        _id: nuevoAdmin._id,
        email: nuevoAdmin.email,
        role: "admin_principal"
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Guardar token y usuario
    nuevoAdmin.token = token;
    await nuevoAdmin.save();

    // Enviar token en cookie segura
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 2 * 60 * 60 * 1000 // 2 horas
    });

    // Enviar respuesta
    res.status(201).json({
      message: "✅ Admin principal registrado y autenticado",
      role: "admin_principal",
      token,
      redirectUrl: "/adminprincipal/ruta4"
    });

  } catch (err) {
    console.error("❌ Error en el registro:", err.message);
    res.status(500).json({ message: "Error al registrar" });
  }
});

module.exports = router;