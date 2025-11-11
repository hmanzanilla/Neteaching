// models_perfil/fotoPerfilModel.js
// Modelo unificado de fotos de perfil (alumno | maestro | administrador | admin_principal)
// Mantiene historial y garantiza UNA “actual” por (tenantId, role, ownerId) usando
// un índice ÚNICO PARCIAL sobre { isCurrent:true }.
// Compatible con legacy (alumnoId + User_alumno.fotoPerfilUrl).

const mongoose = require("mongoose");

const ROLES = ["alumno", "maestro", "administrador", "admin_principal"];

// Control de creación/actualización de índices desde el schema.
// En dev conviene true; en prod puedes desactivarlo y manejar migraciones.
const AUTO_INDEX =
  String(process.env.MONGOOSE_AUTO_INDEX || "true").toLowerCase() === "true";

const FotoPerfilSchema = new mongoose.Schema(
  {
    /* ====== LEGACY (compatibilidad) ====== */
    // NO unique. Solo para lecturas anteriores y búsquedas rápidas.
    alumnoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_alumno",
      required: false,
      index: true,
    },

    /* ====== ESQUEMA UNIFICADO ====== */
    ownerId: {
      type: mongoose.Schema.Types.ObjectId, // Mongoose castea string -> ObjectId
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      default: "default",
      index: true,
    },

    /* ====== ARCHIVO ====== */
    url: { type: String, required: true },   // ruta pública: /uploads/...
    storagePath: { type: String },           // ruta relativa a UPLOADS_ROOT
    mime: { type: String },                  // image/jpeg | image/png | image/webp...
    size: { type: Number },                  // bytes

    /* ====== CONTROL ====== */
    // Permite historial y a la vez una sola “activa” por usuario/rol/tenant
    isCurrent: { type: Boolean, default: true },

    /* ====== TIEMPOS ====== */
    fechaSubida: { type: Date, default: Date.now },
  },
  {
    collection: "fotoperfiles",
    timestamps: false,
    autoIndex: AUTO_INDEX,
  }
);

/* ========= Normalización básica ========= */
FotoPerfilSchema.pre("validate", function (next) {
  if (!this.ownerId) return next(new Error("ownerId es requerido"));
  if (!this.role) return next(new Error("role es requerido"));
  if (!this.tenantId) this.tenantId = "default";
  next();
});

/* ========= Índices ========= */
// 1) Único PARCIAL: UNA sola “actual” por (tenant, role, owner)
FotoPerfilSchema.index(
  { tenantId: 1, role: 1, ownerId: 1, isCurrent: 1 },
  { unique: true, partialFilterExpression: { isCurrent: true } }
);

// 2) Historial por usuario (consultas recientes)
FotoPerfilSchema.index({ tenantId: 1, role: 1, ownerId: 1, fechaSubida: -1 });

// 3) Búsqueda rápida legacy
FotoPerfilSchema.index({ alumnoId: 1 });

/* ========= Utilidad para sincronizar índices desde la app ========= */
FotoPerfilSchema.statics.ensureIndexesSafe = async function ensureIndexesSafe() {
  await this.syncIndexes();
  return true;
};

module.exports =
  mongoose.models.FotoPerfil || mongoose.model("FotoPerfil", FotoPerfilSchema);






