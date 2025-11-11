// backend/routes/administrador/aulas_estado.js

const express = require("express");
const router = express.Router();

const Aula = require("../../ModelAulas/Aula");
// ✅ Middleware propio del ADMIN (no el de maestro)
const authenticateAdministrador = require("../../middlewares/administrador/auth_administrador");

// ----------------- Helpers locales -----------------
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00 - 23:59

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

// normaliza “miercoles/sabado/jueves” → “Miércoles/Sábado/Jueves”
function canonDiaEs(s) {
  const d = String(s || "").toLowerCase();
  const map = {
    "lunes": "Lunes",
    "martes": "Martes",
    "miercoles": "Miércoles",
    "miércoles": "Miércoles",
    "jueves": "Jueves",
    "viernes": "Viernes",
    "sabado": "Sábado",
    "sábado": "Sábado",
    "domingo": "Domingo",
  };
  return map[d] || null;
}

/**
 * Fecha/hora local en una TZ IANA.
 * Devuelve: { dia (canon ES), min (minutos del día), ymd ("YYYY-MM-DD") }
 */
function nowInTZ(tz) {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
  }).formatToParts(d);

  const obj = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const dia = canonDiaEs(obj.weekday);
  const hh = Number(obj.hour);
  const mm = Number(obj.minute);
  return {
    dia: dia || "Lunes",
    min: hh * 60 + mm,
    ymd: `${obj.year}-${obj.month}-${obj.day}`, // YYYY-MM-DD local
  };
}

function buildDisplayName(aula) {
  const nombre = (aula?.nombre || "").trim();
  if (nombre) return nombre;
  const etiqueta = (aula?.grupoEtiqueta || "").trim();
  const materia = (aula?.materia || "").trim();
  return `${etiqueta}${materia ? " - " + materia : ""}`.trim() || "Aula";
}

// ----------------- Endpoint: estado actual -----------------
/**
 * GET /api/administrador/aulas/estado-actual?pre=10&tail=10
 * Clasifica las aulas del administrador como:
 *  - liveNow: now ∈ [inicio - pre, fin + tail]
 *  - upcomingSoon: faltan ≤ pre minutos para el inicio
 *  - justEnded: terminó hace ≤ tail minutos
 * Todo calculado en la TZ de cada aula y solo para el día local actual.
 */
router.get("/estado-actual", authenticateAdministrador, async (req, res) => {
  try {
    // saneo de query params
    const pre = Math.max(0, Math.min(60, Number(req.query.pre) || 10));   // minutos antes
    const tail = Math.max(0, Math.min(60, Number(req.query.tail) || 10)); // minutos después

    // Trae aulas del ADMIN (solo campos necesarios)
    const aulas = await Aula.find({ owner: req.user._id })
      .select("_id nombre materia grupoEtiqueta tz horarios")
      .lean();

    const liveNow = [];
    const upcomingSoon = [];
    const justEnded = [];

    const nowISO = new Date().toISOString();

    for (const a of aulas) {
      const tz = a.tz || "America/Mexico_City";
      const { dia, min: nowMin, ymd } = nowInTZ(tz);
      const displayName = buildDisplayName(a);

      const horarios = Array.isArray(a.horarios) ? a.horarios : [];
      for (const h of horarios) {
        if (h.dia !== dia) continue; // solo el día local actual
        if (!HHMM.test(h.inicio) || !HHMM.test(h.fin)) continue;

        const start = toMinutes(h.inicio);
        const end = toMinutes(h.fin);

        // EN CURSO (con ventanas pre/tail)
        if (nowMin >= (start - pre) && nowMin <= (end + tail)) {
          liveNow.push({
            aulaId: String(a._id),
            displayName,
            nombre: a.nombre || "",
            materia: a.materia || "",
            grupoEtiqueta: a.grupoEtiqueta || "",
            tz,
            tramo: { dia: h.dia, inicio: h.inicio, fin: h.fin, materia: h.materia || "" },
            remainingMs: Math.max(0, (end - nowMin) * 60 * 1000),
            startsAtLocal: `${ymd} ${h.inicio}`,
            endsAtLocal: `${ymd} ${h.fin}`,
          });
          continue;
        }

        // POR COMENZAR (≤ pre minutos)
        if (nowMin < start && (start - nowMin) <= pre) {
          upcomingSoon.push({
            aulaId: String(a._id),
            displayName,
            nombre: a.nombre || "",
            materia: a.materia || "",
            grupoEtiqueta: a.grupoEtiqueta || "",
            tz,
            tramo: { dia: h.dia, inicio: h.inicio, fin: h.fin, materia: h.materia || "" },
            startsInMs: (start - nowMin) * 60 * 1000,
            startsAtLocal: `${ymd} ${h.inicio}`,
            endsAtLocal: `${ymd} ${h.fin}`,
          });
          continue;
        }

        // RECIÉN TERMINÓ (≤ tail minutos)
        if (nowMin > end && (nowMin - end) <= tail) {
          justEnded.push({
            aulaId: String(a._id),
            displayName,
            nombre: a.nombre || "",
            materia: a.materia || "",
            grupoEtiqueta: a.grupoEtiqueta || "",
            tz,
            tramo: { dia: h.dia, inicio: h.inicio, fin: h.fin, materia: h.materia || "" },
            endedAgoMs: (nowMin - end) * 60 * 1000,
            endsAtLocal: `${ymd} ${h.fin}`,
          });
        }
      }
    }

    // Orden UX
    liveNow.sort((a, b) => a.endsAtLocal.localeCompare(b.endsAtLocal));
    upcomingSoon.sort((a, b) => a.startsAtLocal.localeCompare(b.startsAtLocal));

    return res.json({ nowISO, liveNow, upcomingSoon, justEnded });
  } catch (err) {
    return res.status(500).json({
      message: "Error calculando estado actual de aulas",
      detalle: err?.message,
    });
  }
});

module.exports = router;

