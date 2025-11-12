// backend/utils/authCookies.js
const COOKIE_NAMES = {
  alumno: "token_alumno",
  maestro: "token_maestro",
  administrador: "token_administrador",
  admin_principal: "token_admin_principal",
};

/**
 * Define opciones de cookie coherentes con entorno y CORS.
 * - En producción, usa secure:true y sameSite:none si frontend y API están en dominios distintos.
 * - En desarrollo, usa Lax + sin secure para compatibilidad con localhost.
 */
function cookieOptions({ prod = false } = {}) {
  const isCrossSite = Boolean(process.env.CROSS_SITE_COOKIES === "true");
  const sameSite = isCrossSite ? "none" : "lax";
  const secure = prod || isCrossSite;

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
    maxAge: 1000 * 60 * 60 * 12, // 12h
  };
}

/**
 * Extrae el token JWT desde:
 * 1) Authorization: Bearer ...
 * 2) Cookie preferida
 * 3) Cualquiera de las cookies conocidas
 */
function getTokenFromReq(req, preferName) {
  try {
    const bearer = req.header?.("Authorization");
    if (bearer && bearer.startsWith("Bearer ")) {
      return { token: bearer.slice(7).trim(), from: "authorization" };
    }

    const cookies = req.cookies || {};
    if (preferName && cookies[preferName]) {
      return { token: cookies[preferName], from: preferName };
    }

    for (const name of Object.values(COOKIE_NAMES)) {
      if (cookies[name]) return { token: cookies[name], from: name };
    }
    return { token: null, from: null };
  } catch (err) {
    console.warn("⚠ Error leyendo token desde request:", err.message);
    return { token: null, from: "error" };
  }
}

module.exports = { COOKIE_NAMES, cookieOptions, getTokenFromReq };

