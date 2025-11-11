// middlewares/auth_admin_principal.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserAdminPrincipal = require('../models/User_admin_principal');

/**
 * ✅ Middleware de autenticación para el admin principal.
 * - Verifica el token y extrae el usuario desde la base de datos.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    console.log('🔍 Header de autorización recibido:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠ Falta el token en la solicitud o formato incorrecto.');
      return res.status(401).json({ error: 'Acceso denegado: Falta el token' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    console.log('🔍 Token recibido para verificación:', token);
    console.log('🛠 JWT_SECRET en uso:', process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('🔓 Token decodificado correctamente:', decoded);

    const userId = decoded._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn('⚠ Token inválido, el ID de usuario no es válido.');
      return res.status(401).json({ error: 'Acceso denegado: Token inválido' });
    }

    const user = await UserAdminPrincipal.findById(userId).select('-password');
    if (!user) {
      console.warn('⚠ Usuario no encontrado en la base de datos.');
      return res.status(401).json({ error: 'Acceso denegado: Usuario no encontrado' });
    }

    console.log('✅ Usuario autenticado correctamente:', user.email);
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Error en autenticación:', error.message);
    
    // Verifica el tipo de error para proporcionar una mejor respuesta
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido. Asegúrate de estar autenticado correctamente.' });
    }

    return res.status(401).json({ error: 'Acceso denegado: Token inválido o expirado' });
  }
};

/**
 * ✅ Middleware de autorización según roles.
 * - Solo permite el acceso si el usuario tiene un rol autorizado.
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      console.warn('⚠ Acceso denegado: No autenticado.');
      return res.status(403).json({ error: 'Acceso denegado: No autenticado' });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      console.warn(`⚠ Acceso denegado: El usuario ${req.user.email} tiene rol '${req.user.role}', se esperaba uno de: ${roles}`);
      return res.status(403).json({ error: `Acceso denegado: Se requiere uno de los roles: ${roles.join(', ')}` });
    }

    console.log(`✅ Autorización concedida a: ${req.user.email} con rol ${req.user.role}`);
    next();
  };
};

/**
 * ✅ Middleware para garantizar acceso exclusivo al `admin_principal`.
 */
const ensureAdminPrincipal = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin_principal') {
    console.warn(`⚠ Acceso denegado: El usuario ${req.user?.email || 'desconocido'} no es admin_principal.`);
    return res.status(403).json({ error: 'Acceso denegado: Solo el administrador principal puede acceder' });
  }
  console.log(`✅ Acceso concedido a admin_principal: ${req.user.email}`);
  next();
};

module.exports = {
  authenticate,
  authorize,
  ensureAdminPrincipal,
};
