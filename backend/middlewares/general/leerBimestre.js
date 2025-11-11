// backend/middlewares/general/leerBimestre.js
const jwt = require("jsonwebtoken");
const BimestreActual = require("../../models_general/bimestreActualModel");

// 🧠 Resolver el modelo correcto según el rol del token
const getUserModelByRole = (role) => {
  switch (role) {
    case "alumno":
      return require("../../models/User_alumno");
    case "maestro":
      return require("../../models/User_maestro");
    case "administrador":
      return require("../../models/User_admin");
    case "admin_principal":
      return require("../../models/User_admin_principal");
    default:
      throw new Error(`Rol desconocido: ${role}`);
  }
};

/**
 * Middleware: autentica por cookie o Authorization: Bearer
 * y expone el bimestre actual en req.bimestreActual
 *
 * @param {string[]} rolesPermitidos - Si está vacío o no es array, no filtra por rol.
 */
const leerBimestre = (rolesPermitidos = null) => {
  return async (req, res, next) => {
    try {
      // 1) Obtener token desde cookie o header Authorization
      let token = null;
      if (req.cookies?.token) {
        token = req.cookies.token;
      } else {
        const auth = req.header("Authorization");
        if (auth && auth.startsWith("Bearer ")) {
          token = auth.split(" ")[1];
        }
      }

      if (!token) {
        return res
          .status(401)
          .json({ error: "Token no proporcionado (cookie o Authorization)." });
      }

      // 2) Verificar/decodificar JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // En tus logs el payload viene como {_id: "...", ...}
      const userId = decoded.userId || decoded._id || decoded.id;
      const role = decoded.role;

      if (!userId || !role) {
        return res.status(401).json({ error: "Token inválido: faltan claims." });
      }

      // 3) Cargar modelo por rol y buscar usuario
      const User = getUserModelByRole(role);
      const usuario = await User.findById(userId).select("token role");

      if (!usuario) {
        return res
          .status(401)
          .json({ error: "Usuario no encontrado para el token." });
      }

      // 4) Validar sesión única: token guardado debe coincidir
      if (!usuario.token || usuario.token !== token) {
        return res.status(401).json({ error: "Token no válido o revocado." });
      }

      // 5) Filtrado por rol (solo si rolesPermitidos trae elementos)
      const debeFiltrar =
        Array.isArray(rolesPermitidos) && rolesPermitidos.length > 0;
      if (debeFiltrar && !rolesPermitidos.includes(role)) {
        return res
          .status(403)
          .json({ error: "Acceso denegado: rol no autorizado." });
      }

      // 6) Obtener bimestre actual (último por fechaActualizacion)
      const bimestreDoc = await BimestreActual.findOne().sort({
        fechaActualizacion: -1,
      });
      if (!bimestreDoc) {
        return res
          .status(404)
          .json({ error: "No se encontró el bimestre actual." });
      }

      // 7) Exponer en req y continuar
      req.usuario = { id: userId, role };
      req.bimestreActual = bimestreDoc.bimestre;

      return next();
    } catch (error) {
      console.error("❌ Error en middleware leerBimestre:", error);
      return res
        .status(500)
        .json({ error: "Error en autenticación o al leer bimestre." });
    }
  };
};

module.exports = leerBimestre;