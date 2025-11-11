// backend/ModelAulas/Aula.js
// backend/ModelAulas/Aula.js
const mongoose = require("mongoose");

// ------------------------- Helpers -------------------------
const DIA_ENUM = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIA_A_NUM = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7 };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00 - 23:59

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

// Normaliza etiqueta -> slug propio del maestro (lowercase, sin acentos/espacios)
function slugifyEtiqueta(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")                       // no alfanum -> _
    .replace(/^_+|_+$/g, "");                          // trim _
}

// ---------------------- Subdocumento -----------------------
const HorarioSchema = new mongoose.Schema(
  {
    dia: { type: String, enum: DIA_ENUM, required: true },
    diaNum: { type: Number, min: 1, max: 7 }, // se autocompleta desde 'dia'
    inicio: { type: String, required: true, match: HHMM }, // HH:mm
    fin: { type: String, required: true, match: HHMM },    // HH:mm
    materia: { type: String, default: "" },                // opcional por tramo
  },
  { _id: false }
);

// Antes de validar cada subdoc: setear diaNum y checar inicio<fin
HorarioSchema.pre("validate", function (next) {
  if (!this.diaNum) this.diaNum = DIA_A_NUM[this.dia];
  if (HHMM.test(this.inicio) && HHMM.test(this.fin)) {
    if (toMinutes(this.inicio) >= toMinutes(this.fin)) {
      return next(new Error(`El intervalo ${this.inicio}-${this.fin} no es válido (inicio < fin).`));
    }
  }
  next();
});

// ------------------------- Aula ----------------------------
const AulaSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombre: { type: String, required: true, trim: true },
    materia: { type: String, default: "" },
    grupoEtiqueta: { type: String, required: true, trim: true },
    grupoEtiquetaSlug: { type: String, required: true, index: true },
    tz: { type: String, required: true, default: "America/Mexico_City", trim: true },
    grupoId: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", default: null },
    horarios: { type: [HorarioSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.grupoEtiquetaSlug;
        return ret;
      },
    },
  }
);

// Índices
AulaSchema.index({ owner: 1 });
AulaSchema.index({ owner: 1, grupoEtiquetaSlug: 1 }, { unique: true });

// Pre-validate: generar slug y validar solapes por día
AulaSchema.pre("validate", function (next) {
  // slug de la etiqueta
  this.grupoEtiquetaSlug = slugifyEtiqueta(this.grupoEtiqueta);

  // Validar solapes por día
  if (Array.isArray(this.horarios) && this.horarios.length > 0) {
    const porDia = {};
    for (const h of this.horarios) {
      const key = h.dia || "???";
      (porDia[key] = porDia[key] || []).push(h);
    }
    for (const [dia, items] of Object.entries(porDia)) {
      items.sort((a, b) => toMinutes(a.inicio) - toMinutes(b.inicio));
      for (let i = 1; i < items.length; i++) {
        const prev = items[i - 1];
        const cur = items[i];
        if (toMinutes(prev.fin) > toMinutes(cur.inicio)) {
          return next(new Error(`Solapamiento en ${dia}: ${prev.inicio}-${prev.fin} con ${cur.inicio}-${cur.fin}`));
        }
      }
    }
  }

  next();
});

module.exports = mongoose.models.Aula || mongoose.model("Aula", AulaSchema);
