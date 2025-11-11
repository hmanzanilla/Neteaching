// backend/middlewares/administrador/aulas_estado.js

/**
 * Middleware para saneo de query params del endpoint:
 * GET /api/administrador/aulas/estado-actual?pre=10&tail=10
 *
 * - pre:  minutos antes del inicio para considerar "por comenzar"
 * - tail: minutos después del fin para considerar "recién terminó"
 *
 * Deja los valores validados en req.estadoOpts = { pre, tail }
 * y continúa sin cortar el flujo (se hace "clamp" en lugar de 400).
 */

const DEFAULT_PRE_MIN = 10;   // minutos
const DEFAULT_TAIL_MIN = 10;  // minutos
const MIN_ALLOWED_MIN = 0;    // mínimo permitido
const MAX_ALLOWED_MIN = 60;   // máximo permitido

function toInt(val, fallback) {
  const n = Number(val);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function validarEstadoActualQuery(req, _res, next) {
  try {
    const preRaw = req.query?.pre;
    const tailRaw = req.query?.tail;

    const pre = clamp(toInt(preRaw, DEFAULT_PRE_MIN), MIN_ALLOWED_MIN, MAX_ALLOWED_MIN);
    const tail = clamp(toInt(tailRaw, DEFAULT_TAIL_MIN), MIN_ALLOWED_MIN, MAX_ALLOWED_MIN);

    req.estadoOpts = { pre, tail };
    next();
  } catch (err) {
    // En caso de algo inesperado, usamos defaults y seguimos
    req.estadoOpts = { pre: DEFAULT_PRE_MIN, tail: DEFAULT_TAIL_MIN };
    next();
  }
}

module.exports = {
  validarEstadoActualQuery,

  // Exportamos constantes por si quieres testear o reutilizar
  DEFAULT_PRE_MIN,
  DEFAULT_TAIL_MIN,
  MIN_ALLOWED_MIN,
  MAX_ALLOWED_MIN,
};
