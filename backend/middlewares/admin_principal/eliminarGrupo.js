// middlewares/admin_principal/eliminarGrupo.js

const jwt = require("jsonwebtoken");

/**
 * Middleware para validar token desde cookies
 * y permitir solo a admin_principal eliminar grupos.
 */
const validarEliminarGrupo = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    console.warn("⛔ [Token] Token no presente en cookies.");
    return res.status(401).json({ error: "Token faltante. No autorizado." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin_principal") {
      console.warn("🚫 [Permiso denegado] Solo el admin_principal puede eliminar grupos.");
      return res.status(403).json({ error: "Acceso denegado. No es administrador principal." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ [Token inválido] Error al verificar el token:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

module.exports = { validarEliminarGrupo };
