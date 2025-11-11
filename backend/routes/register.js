// backend/routes/gister.js
const express = require('express');
const bcryptjs = require('bcryptjs');
const router = express.Router();

const { checkEmail, validateRegisterData } = require('../middlewares/register');

// Importar los modelos por separado
const User_alumno = require('../models/User_alumno');
const User_maestro = require('../models/User_maestro');
const User_administrador = require('../models/User_admin');
const User_admin_principal = require('../models/User_admin_principal');

// Para detectar el rol a partir del password (solo si no se envía explícito)
const determinarRol = (password) => {
  if (password.startsWith("Maestro_")) return "maestro";
  if (password.startsWith("Administrador_")) return "administrador";
  if (password.startsWith("AdminPrincipal_")) return "admin_principal";
  return "alumno";
};

router.post('/', checkEmail, validateRegisterData, async (req, res) => {
  try {
    const {
      email, password, username, firstName, lastName,
      phoneNumber, sex
      // 🔹 OJO: no tomamos curp directamente de aquí
    } = req.body;

    // 🔹 Normaliza y valida CURP (solo cambios de CURP)
    const curpRaw = (req.body.curp ?? req.body.CURP ?? '').toString().trim().toUpperCase();
    if (!curpRaw) {
      return res.status(400).json({ message: "❌ El campo CURP es obligatorio." });
    }
    const curpRegex = /^[A-Z0-9]{18}$/;
    if (!curpRegex.test(curpRaw)) {
      return res.status(400).json({ message: "❌ CURP inválida. Debe tener 18 caracteres alfanuméricos en mayúsculas." });
    }

    const role = req.body.role || determinarRol(password);
    const status = role === "alumno" ? "pending" : "active";

    // Seleccionar el modelo correcto
    let UserModel;
    switch (role) {
      case "alumno":
        UserModel = User_alumno;
        break;
      case "maestro":
        UserModel = User_maestro;
        break;
      case "administrador":
        UserModel = User_administrador;
        break;
      case "admin_principal":
        UserModel = User_admin_principal;
        break;
      default:
        return res.status(400).json({ message: "❌ Rol inválido proporcionado." });
    }

    const newUser = new UserModel({
      email,
      password,
      username,
      firstName,
      lastName,
      phoneNumber,
      sex,
      curp: curpRaw, // ✅ guardar la CURP ya normalizada
      role,
      status,
    });

    const savedUser = await newUser.save();
    const token = await savedUser.generateAuthToken();

    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "Lax",
        maxAge: 2 * 60 * 60 * 1000,
      })
      .status(201)
      .send({
        message: '✅ Registro exitoso.',
        userId: savedUser._id,
        role: savedUser.role,
        token,
      });

  } catch (error) {
    console.error('❌ Error completo al registrar usuario:', error);

    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue || error.keyPattern || {})[0];
      const valor = (error.keyValue && error.keyValue[campo]) || 'duplicado';
      return res.status(409).send({
        message: `❌ El valor '${valor}' ya está registrado en el campo '${campo}'.`
      });
    }

    res.status(500).send({
      message: '❌ Error interno al registrar el usuario.',
      error: error.message
    });
  }
});

module.exports = router;