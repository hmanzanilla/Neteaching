// middlewares/register.js
// 🔄 Validación de registro para alumnos, maestros, administradores y admin principal

const UserAlumno = require('../models/User_alumno');
const UserMaestro = require('../models/User_maestro');
const UserAdministrador = require('../models/User_admin');
const UserAdminPrincipal = require('../models/User_admin_principal');

/**
 * 🔹 Middleware para verificar si el correo ya está registrado en alguna colección de usuarios
 */
const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Buscar el correo en todas las colecciones de usuario
    const userExists =
      (await UserAlumno.findOne({ email })) ||
      (await UserMaestro.findOne({ email })) ||
      (await UserAdministrador.findOne({ email })) ||
      (await UserAdminPrincipal.findOne({ email }));

    if (userExists) {
      return res.status(409).json({ message: 'El correo ya está registrado en el sistema.' });
    }

    next();
  } catch (error) {
    console.error('❌ Error en checkEmail:', error);
    res.status(500).json({ message: 'Error en la validación del correo.' });
  }
};

/**
 * 🔹 Middleware para validar los datos del usuario antes del registro
 */
const validateRegisterData = (req, res, next) => {
  try {
    let { email, password, username, firstName, lastName, curp, phoneNumber, sex } = req.body;

    // Convertir todos los valores a string (previene errores)
    email = String(email).trim();
    password = String(password).trim();
    username = String(username).trim();
    firstName = String(firstName).trim();
    lastName = String(lastName).trim();
    curp = String(curp).trim();
    phoneNumber = String(phoneNumber).trim();
    sex = String(sex).trim();

    // Validación de campos obligatorios
    if (!email || !password || !username || !firstName || !lastName || !curp || !phoneNumber || !sex) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Correo electrónico inválido.' });
    }

    // Validación de contraseña
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&_\-])[A-Za-z\d@$!%*?&_\-]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, incluyendo letras, números y un carácter especial.' });
    }

    // Validación de teléfono (10 dígitos)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Número de teléfono inválido. Debe contener 10 dígitos.' });
    }

    // Validación de sexo
    if (!['Masculino', 'Femenino'].includes(sex)) {
      return res.status(400).json({ message: 'Sexo inválido. Debe ser "Masculino" o "Femenino".' });
    }

    next();
  } catch (error) {
    console.error('❌ Error en validateRegisterData:', error);
    res.status(500).json({ message: 'Error en la validación del formulario.' });
  }
};

module.exports = { checkEmail, validateRegisterData };