// backend/ModelAulas/eleccionGrupoModel.js
// backend/ModelAulas/eleccionGrupoModel.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * EleccionGrupo
 * Fuente de verdad de la inscripción de un alumno en un grupo (por bimestre).
 * Colección: elecciongrupos
 *
 * Reglas clave:
 * - Un alumno solo puede estar en UN grupo por bimestre (índice único alumnoId+bimestre).
 * - Denormalizamos algunos campos para listados rápidos (turno, nombreGrupo, nombreHorario, curpProfesor).
 */

const eleccionGrupoSchema = new Schema(
  {
    alumnoId: {
      type: Schema.Types.ObjectId,
      ref: "User_alumno",
      required: true,
    },
    grupoId: {
      type: Schema.Types.ObjectId,
      ref: "Grupo",
      required: true,
    },
    bimestre: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },

    // Estado/fuente de la asignación
    estado: {
      type: String,
      enum: ["confirmed"],
      default: "confirmed",
      required: true,
    },
    fuente: {
      type: String,
      enum: ["auto", "admin"],
      default: "auto",
    },

    fecha_asignacion: {
      type: Date,
      default: Date.now,
    },

    // Denormalizados útiles (opcionales) para listados y vistas rápidas
    nombreGrupo: { type: String, trim: true }, // copia de Grupo.nombre
    turno: {
      type: String,
      enum: ["Matutino", "Vespertino", "Mixto"],
    },
    nombreHorario: { type: String, trim: true },
    curpProfesor: { type: String, trim: true },
  },
  {
    collection: "elecciongrupos",
    timestamps: true, // createdAt, updatedAt
  }
);

// Índices
// 1) Unicidad: un alumno no puede inscribirse en más de un grupo en el mismo bimestre
eleccionGrupoSchema.index({ alumnoId: 1, bimestre: 1 }, { unique: true });

// 2) Para listar alumnos de un grupo rápidamente (y por bimestre si lo quieres explícito)
eleccionGrupoSchema.index({ grupoId: 1, bimestre: 1 });

// 3) Búsquedas por profesor (si en el futuro consultas por curpProfesor)
eleccionGrupoSchema.index({ curpProfesor: 1, bimestre: 1 });

// Evita recompilar el modelo si el archivo se importa múltiples veces en dev
const EleccionGrupo =
  mongoose.models.EleccionGrupo ||
  mongoose.model("EleccionGrupo", eleccionGrupoSchema);

module.exports = EleccionGrupo;
