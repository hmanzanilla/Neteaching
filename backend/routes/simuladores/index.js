// backend/routes/simuladores/index.js
const express = require("express");
const router = express.Router();

// OJO: ajusta este require a donde esté realmente tu modelo.
// Si tu archivo real es backend/models/Simulador.js, usa:
const Simulador = require("../../models_simuladores/simulador");
// Si en tu proyecto es otro path (p.ej. models_simuladores/simulador), cambia la ruta de arriba.

function toSegundos({ duracionSegundos, tiempoMinutos, tiempoSegundos }) {
  if (Number.isFinite(Number(duracionSegundos))) return Math.max(0, Number(duracionSegundos));
  const min = Number(tiempoMinutos) || 0;
  const seg = Number(tiempoSegundos) || 0;
  return Math.max(0, min * 60 + seg);
}

// Aux: suma (min, seg) al total (min, seg) con carry
function acumular(minTot, segTot, segNuevos) {
  let totalSeg = minTot * 60 + segTot + segNuevos;
  if (totalSeg < 0) totalSeg = 0;
  return {
    minutos: Math.floor(totalSeg / 60),
    segundos: totalSeg % 60
  };
}

/**
 * GET /api/simuladores/ping
 * Para verificar que el router está montado.
 */
router.get("/ping", (req, res) => {
  console.log("✅ [simuladores] /ping");
  res.json({ ok: true, pong: true });
});

/**
 * POST /api/simuladores/track
 * Body:
 *  - simulador: string (ej. "suma_fracciones")  *en español*
 *  - duracionSegundos  (o tiempoMinutos + tiempoSegundos)
 *  - usuarioId  (si no usas middleware de auth)
 *  - operaciones (opcional; hoy no se guarda)
 */
router.post("/track", async (req, res) => {
  try {
    console.log("📥 [simuladores/track] Body recibido:", req.body);

    const usuarioId = req.user?._id || req.body.usuarioId;
    const { simulador } = req.body;

    if (!usuarioId) {
      console.warn("⚠ Falta usuarioId");
      return res.status(401).json({ ok: false, error: "No autorizado (falta usuarioId)" });
    }
    if (!simulador) {
      console.warn("⚠ Falta simulador");
      return res.status(400).json({ ok: false, error: "simulador es requerido" });
    }

    const seg = toSegundos(req.body);
    const ahora = new Date();

    // Buscamos doc existente (campos en español como en tu schema)
    let doc = await Simulador.findOne({ usuarioId, simulador });
    console.log("🔎 Doc existente:", doc ? "sí" : "no");

    if (!doc) {
      // Crear nuevo
      const mins = Math.floor(seg / 60);
      const segResto = seg % 60;

      doc = await Simulador.create({
        usuarioId,
        simulador,
        ejecuciones: 1,
        minutosTotales: mins,
        segundosTotales: segResto,
        minutosUltima: mins,
        segundosUltima: segResto,
        ultimaEjecucionAt: ahora,
      });

      console.log("🆕 Creado doc:", doc._id);
    } else {
      // Acumular al total
      const tot = acumular(doc.minutosTotales, doc.segundosTotales, seg);
      doc.minutosTotales = tot.minutos;
      doc.segundosTotales = tot.segundos;

      // Última ejecución
      const minsN = Math.floor(seg / 60);
      const segN = seg % 60;
      doc.minutosUltima = minsN;
      doc.segundosUltima = segN;

      doc.ejecuciones = (doc.ejecuciones || 0) + 1;
      doc.ultimaEjecucionAt = ahora;

      await doc.save();
      console.log("✏ Actualizado doc:", doc._id);
    }

    return res.json({ ok: true, data: doc });
  } catch (err) {
    console.error("❌ simuladores/track error:", err);
    return res.status(500).json({ ok: false, error: "Error interno al registrar simulador" });
  }
});

module.exports = router;