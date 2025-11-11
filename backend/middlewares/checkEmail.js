const UserAlumno = require('../models/User_alumno');
const UserMaestro = require('../models/User_maestro');
const UserAdministrador = require('../models/User_admin');
const UserAdminPrincipal = require('../models/User_admin_principal');

/**
 * Middleware para verificar si un correo electrónico ya está registrado en cualquier rol.
 */
const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Error: El correo electrónico es obligatorio' });
    }

    // Verificar en cada colección si ya existe ese correo
    const modelos = [UserAlumno, UserMaestro, UserAdministrador, UserAdminPrincipal];

    for (const Modelo of modelos) {
      const existingUser = await Modelo.findOne({ email }).select('_id');
      if (existingUser) {
        console.warn(`⚠️ Correo ya registrado en alguna colección: ${email}`);
        return res.status(409).json({ message: 'El correo electrónico ya está registrado' });
      }
    }

    // Si no se encontró en ninguna colección, continuar
    next();
  } catch (error) {
    console.error('❌ Error en checkEmail:', error);
    res.status(500).json({ message: 'Error interno del servidor al verificar el correo' });
  }
};

module.exports = checkEmail;