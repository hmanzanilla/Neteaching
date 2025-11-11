// middlewares/admin_principal/leerhorarios.js

const jwt = require("jsonwebtoken");

/**
 * Middleware para validar la autenticación por cookie
 * y permitir solo a usuarios con el rol 'admin_principal'.
 */
const validarLeerHorarios = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    console.warn("⛔ [Autenticación] Token no proporcionado en cookies.");
    return res.status(401).json({ error: "No autorizado. Token faltante en cookies." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin_principal") {
      console.warn("🚫 [Acceso] Solo el administrador principal puede leer los horarios.");
      return res.status(403).json({ error: "Acceso denegado. Requiere permisos de administrador principal." });
    }

    req.user = decoded; // ✔️ Adjuntar el usuario decodificado al request
    next();
  } catch (error) {
    console.error("❌ [Token] Token inválido o expirado:", error.message);
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

module.exports = { validarLeerHorarios };
