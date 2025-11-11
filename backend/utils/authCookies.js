//backend/utils/authCookies.js
// backend/utils/authCookies.js
const COOKIE_NAMES = {
  alumno: "token_alumno",
  maestro: "token_maestro",
  administrador: "token_administrador",
  admin_principal: "token_admin_principal",
};

function cookieOptions({ prod = false } = {}) {
  return {
    httpOnly: true,
    sameSite: prod ? "lax" : "lax",   // si front y API van en dominios distintos: "none" + secure:true
    secure: prod,
    path: "/",
    maxAge: 1000 * 60 * 60 * 12,      // 12h
  };
}

/**
 * Devuelve { token, from } buscando en:
 * 1) Authorization: Bearer ...
 * 2) cookie preferida (si se pasa preferName)
 * 3) cualquiera de las cookies conocidas
 */
function getTokenFromReq(req, preferName) {
  const bearer = req.header?.("Authorization");
  if (bearer && bearer.startsWith("Bearer ")) {
    return { token: bearer.slice(7).trim(), from: "authorization" };
  }

  const cookies = (req.cookies || {});
  if (preferName && cookies[preferName]) {
    return { token: cookies[preferName], from: preferName };
  }

  for (const name of Object.values(COOKIE_NAMES)) {
    if (cookies[name]) return { token: cookies[name], from: name };
  }
  return { token: null, from: null };
}

module.exports = { COOKIE_NAMES, cookieOptions, getTokenFromReq };
