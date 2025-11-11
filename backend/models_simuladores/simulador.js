// backend/models/Simulador.js
const mongoose = require("mongoose");

const SimuladorSchema = new mongoose.Schema(
  {
    // Relación con el usuario
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Nombre o clave del simulador
    simulador: {
      type: String,
      required: true,
      trim: true,
    },

    // Métricas
    ejecuciones:       { type: Number, default: 0 }, // veces ejecutado

    minutosTotales:    { type: Number, default: 0 },
    segundosTotales:   { type: Number, default: 0 }, // 0–59

    minutosUltima:     { type: Number, default: 0 },
    segundosUltima:    { type: Number, default: 0 }, // 0–59

    ultimaEjecucionAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "simuladores",
  }
);

// Unicidad por usuario + simulador
SimuladorSchema.index({ usuarioId: 1, simulador: 1 }, { unique: true });

// Método para registrar/actualizar una corrida
SimuladorSchema.statics.trackRun = async function ({
  usuarioId,
  simulador,
  duracionSegundos = 0,
}) {
  if (!usuarioId) throw new Error("usuarioId es requerido");
  if (!simulador) throw new Error("simulador es requerido");

  const segs = Math.max(0, Number(duracionSegundos) || 0);
  const mins = Math.floor(segs / 60);
  const segResto = segs % 60;

  const ahora = new Date();

  // Buscamos el documento existente
  let doc = await this.findOne({ usuarioId, simulador });

  if (!doc) {
    // Crear nuevo
    doc = await this.create({
      usuarioId,
      simulador,
      ejecuciones: 1,
      minutosTotales: mins,
      segundosTotales: segResto,
      minutosUltima: mins,
      segundosUltima: segResto,
      ultimaEjecucionAt: ahora,
    });
  } else {
    // Sumar al total
    let totalSegundos = doc.minutosTotales * 60 + doc.segundosTotales + segs;
    doc.minutosTotales = Math.floor(totalSegundos / 60);
    doc.segundosTotales = totalSegundos % 60;

    // Actualizar última duración
    doc.minutosUltima = mins;
    doc.segundosUltima = segResto;

    doc.ejecuciones += 1;
    doc.ultimaEjecucionAt = ahora;

    await doc.save();
  }

  return doc;
};

module.exports =
  mongoose.models.Simulador || mongoose.model("Simulador", SimuladorSchema);