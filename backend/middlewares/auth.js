// backend/middlewares/auth.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const UserAlumno = require('../models/User_alumno');
const UserMaestro = require('../models/User_maestro');
const UserAdministrador = require('../models/User_admin');
const UserAdminPrincipal = require('../models/User_admin_principal');

/**
 * ✅ Middleware de autenticación (una sola sesión activa por usuario)
 */
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    // Si no hay cookie, intenta desde el header
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!token) {
      console.error('❌ Token no encontrado en cookie ni header');
      return res.status(401).json({ error: 'Acceso denegado: Falta el token de autenticación' });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Token decodificado:', decoded);

    if (!mongoose.Types.ObjectId.isValid(decoded._Id)) {
      return res.status(401).json({ error: 'Token inválido: ID incorrecto' });
    }

    // Detectar modelo según rol
    let UserModel;
    switch (decoded.role) {
      case 'alumno':
        UserModel = UserAlumno;
        break;
      case 'maestro':
        UserModel = UserMaestro;
        break;
      case 'administrador':
        UserModel = UserAdministrador;
        break;
      case 'admin_principal':
        UserModel = UserAdminPrincipal;
        break;
      default:
        console.error('❌ Rol no válido en token:', decoded.role);
        return res.status(401).json({ error: 'Rol no reconocido' });
    }

    // Buscar usuario y validar token
    const user = await UserModel.findById(decoded._Id).select('-password');
    if (!user || user.token !== token) {
      console.warn('❌ Token no coincide o usuario no encontrado');
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Error al verificar token:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * ✅ Middleware de autorización basado en rol y estado opcional
 */
const authorize = (roles = [], requiredStatus = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'No autenticado' });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Acceso denegado: Rol no autorizado (${req.user.role})` });
    }

    if (requiredStatus && req.user.status !== requiredStatus) {
      return res.status(403).json({
        error: `Acceso denegado: Estado requerido '${requiredStatus}', pero tienes '${req.user.status}'`,
      });
    }

    next();
  };
};

/**
 * ✅ Middleware específico para el admin_principal
 */
const ensureAdminPrincipal = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin_principal') {
    return res.status(403).json({ error: 'Acceso denegado: Solo el administrador principal puede acceder' });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  ensureAdminPrincipal,
};