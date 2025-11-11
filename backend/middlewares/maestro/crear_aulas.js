//backend/middlewares/maestro/crear_aulas.js
// backend/middlewares/maestro/crear_aulas.js

// ---------------- Constantes y utilidades ----------------
const DIAS_CANONICOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00 - 23:59

const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

const stripAccentsLower = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const CANON_MAP = (() => {
  const map = new Map();
  for (const d of DIAS_CANONICOS) {
    map.set(stripAccentsLower(d), d); // 'miercoles' -> 'Miércoles'
  }
  return map;
})();

function canonizarDia(dia) {
  const d = stripAccentsLower(dia);
  return CANON_MAP.get(d) || null;
}

// Convierte un grid de la UI a una lista normalizada de tramos horarios
// grid: [{ inicio, fin, Lunes, Martes, ... }]
function gridToHorarios(grid = []) {
  const out = [];
  for (const fila of grid) {
    if (!fila) continue;
    const { inicio, fin, ...dias } = fila;
    if (!HHMM.test(inicio) || !HHMM.test(fin) || toMin(inicio) >= toMin(fin)) continue;

    for (const diaKey of Object.keys(dias)) {
      const canon = canonizarDia(diaKey);
      if (!canon) continue;
      const materia = String(dias[diaKey] || "").trim();
      if (materia) {
        out.push({ dia: canon, inicio, fin, materia });
      }
    }
  }
  return out;
}

// Valida una lista de horarios: día válido, inicio<fin, formato HH:mm y sin solapes por día
function validarHorariosLista(horarios = []) {
  if (!Array.isArray(horarios)) {
    return { ok: false, error: "horarios debe ser un arreglo" };
  }
  const normalizados = [];

  for (const h of horarios) {
    if (!h) continue;
    const diaCanon = canonizarDia(h.dia);
    const inicio = (h.inicio || "").trim();
    const fin = (h.fin || "").trim();
    const materia = String(h.materia || "").trim();

    if (!diaCanon) {
      return { ok: false, error: `Día inválido: ${h.dia}` };
    }
    if (!HHMM.test(inicio) || !HHMM.test(fin)) {
      return { ok: false, error: `Formato HH:mm inválido en ${diaCanon}: ${inicio}-${fin}` };
    }
    if (toMin(inicio) >= toMin(fin)) {
      return { ok: false, error: `Intervalo inválido en ${diaCanon}: ${inicio}-${fin} (inicio < fin)` };
    }

    normalizados.push({ dia: diaCanon, inicio, fin, materia });
  }

  // Solapes por día
  const porDia = new Map();
  for (const h of normalizados) {
    if (!porDia.has(h.dia)) porDia.set(h.dia, []);
    porDia.get(h.dia).push(h);
  }
  for (const [dia, lista] of porDia.entries()) {
    lista.sort((a, b) => toMin(a.inicio) - toMin(b.inicio));
    for (let i = 1; i < lista.length; i++) {
      const prev = lista[i - 1];
      const cur = lista[i];
      if (toMin(prev.fin) > toMin(cur.inicio)) {
        return {
          ok: false,
          error: `Solapamiento en ${dia}: ${prev.inicio}-${prev.fin} con ${cur.inicio}-${cur.fin}`,
        };
      }
    }
  }

  return { ok: true, data: normalizados };
}

// ---------------- Middlewares ----------------

// POST /api/maestro/crear-aulas
// Valida payload para crear aula (metadata + horarios opcionales)
async function validarCreacionAula(req, res, next) {
  try {
    const body = req.body || {};
    const nombre = String(body.nombre || "").trim();
    const grupoEtiqueta = String(body.grupoEtiqueta || "").trim();
    const tz = String(body.tz || "America/Mexico_City").trim();
    const materia = String(body.materia || "").trim();

    if (!nombre || !grupoEtiqueta) {
      return res.status(400).json({ message: "nombre y grupoEtiqueta son obligatorios" });
    }
    if (!tz) {
      return res.status(400).json({ message: "tz es obligatoria" });
    }

    // Normalizar horarios: acepta 'horarios' o 'grid'
    let horariosNorm = [];
    if (Array.isArray(body.horarios) && body.horarios.length > 0) {
      const v = validarHorariosLista(body.horarios);
      if (!v.ok) return res.status(400).json({ message: v.error });
      horariosNorm = v.data;
    } else if (Array.isArray(body.grid) && body.grid.length > 0) {
      const conv = gridToHorarios(body.grid);
      const v = validarHorariosLista(conv);
      if (!v.ok) return res.status(400).json({ message: v.error });
      horariosNorm = v.data;
    }
    // Nota: permitir crear aula SIN horarios; se pueden cargar después con /:id/horarios

    // Guardamos payload validado para el controlador
    req.aulaPayload = { nombre, grupoEtiqueta, tz, materia, horarios: horariosNorm };
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Error validando aula", detalle: err?.message });
  }
}

// POST /api/maestro/crear-aulas/:id/horarios
// Valida que se envíen horarios (o grid) y que no tengan solapes ni formatos inválidos
async function validarSetHorarios(req, res, next) {
  try {
    const body = req.body || {};

    let horariosNorm = [];
    if (Array.isArray(body.horarios) && body.horarios.length > 0) {
      const v = validarHorariosLista(body.horarios);
      if (!v.ok) return res.status(400).json({ message: v.error });
      horariosNorm = v.data;
    } else if (Array.isArray(body.grid) && body.grid.length > 0) {
      const conv = gridToHorarios(body.grid);
      const v = validarHorariosLista(conv);
      if (!v.ok) return res.status(400).json({ message: v.error });
      horariosNorm = v.data;
    } else {
      return res.status(400).json({
        message: "Debes enviar 'horarios' (array) o 'grid' con al menos un tramo válido",
      });
    }

    req.horariosPayload = horariosNorm;
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Error validando horarios", detalle: err?.message });
  }
}

// -------------- Exports --------------
module.exports = {
  // constantes por si las necesitas en controladores/tests
  DIAS_CANONICOS,
  HHMM,

  // helpers por si quieres reutilizarlos
  gridToHorarios,
  validarHorariosLista,

  // middlewares
  validarCreacionAula,
  validarSetHorarios,
};
