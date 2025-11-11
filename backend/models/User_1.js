// backend/models/User.js
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ⚙️ Discriminador por rol y timestamps en una sola colección
const options = { discriminatorKey: "role", collection: "users", timestamps: true };

const BaseUserSchema = new mongoose.Schema(
  {
    // Identificación y autenticación
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    username: { type: String, required: true, unique: true, trim: true },

    // Datos generales
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },

    // 👇 SOLO CURP (nuevo): normalizado a MAYÚSCULAS y validado
    curp: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]{18}$/, "CURP inválida. Debe tener 18 caracteres alfanuméricos en mayúsculas."]
    },

    phoneNumber: { type: String, required: true, trim: true },
    sex: { type: String, enum: ["Masculino", "Femenino", "Otro"], required: true },

    // Estado de negocio para permitir o no el acceso
    status: { type: String, enum: ["pending", "active"], default: "pending" },

    // 🔐 Control de sesión y revocación
    token: { type: String, default: null },

    // ⏳ Expiración real a nivel BD (TTL). IMPORTANTE: Debe ser Date para TTL.
    //   Se actualiza al firmar el JWT, usando el 'exp' decodificado o un fallback a 2h.
    tokenExpiresAt: { type: Date, default: null },

    // 🔸 Control de sesión activa (bloquear doble login)
    estado: { type: String, enum: ["desconectado", "conectado"], default: "desconectado" },

    // 🫀 Heartbeat opcional: permite estrategias de auto-desconexión si no hay latidos recientes
    lastSeenAt: { type: Date, default: null }
  },
  options
);

// Índices
BaseUserSchema.index({ curp: 1 }, { unique: true });
// TTL: cuando tokenExpiresAt <= now, el documento NO se elimina; el TTL elimina el documento si se usa así.
// Aquí lo usamos como "indicador" temporal y NO queremos borrar el documento de usuario.
// Por eso NO ponemos expireAfterSeconds sobre el documento completo.
// En su lugar, haremos validación de expiración en el middleware/rutas.
// (Si quisieras limpieza automatizada de tokens zombies, usaríamos jobs/cron o un subdocumento aparte).

// Normalización de CURP + hash de contraseña
BaseUserSchema.pre("save", async function (next) {
  if (this.curp) this.curp = String(this.curp).trim().toUpperCase();

  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Métodos de instancia
BaseUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

BaseUserSchema.methods.generateAuthToken = async function (opts = {}) {
  const expiresIn = opts.expiresIn || "2h";
  const token = jwt.sign(
    { userId: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  // Decodificamos para obtener 'exp' (segundos desde Epoch) y lo pasamos a Date
  const decoded = jwt.decode(token);
  let expDate = null;
  if (decoded && decoded.exp) {
    expDate = new Date(decoded.exp * 1000);
  } else {
    // Fallback por si no viniera 'exp' (no debería pasar): +2h
    expDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  this.token = token;
  this.tokenExpiresAt = expDate;
  this.lastSeenAt = new Date();

  await this.save();
  return token;
};

BaseUserSchema.methods.revokeToken = async function () {
  this.token = null;
  this.tokenExpiresAt = null;
  this.estado = "desconectado";
  await this.save();
};

BaseUserSchema.methods.isTokenValid = function (candidateToken) {
  if (!this.token || !candidateToken) return false;
  if (this.token !== candidateToken) return false;
  if (this.tokenExpiresAt && this.tokenExpiresAt.getTime() <= Date.now()) return false;
  return true;
};

BaseUserSchema.methods.touchHeartbeat = async function () {
  this.lastSeenAt = new Date();
  await this.save();
};

// Métodos estáticos
BaseUserSchema.statics.findByToken = async function (candidateToken) {
  try {
    const decoded = jwt.verify(candidateToken, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded._id || decoded.id;
    if (!userId) return null;

    const user = await this.findOne({ _id: userId, token: candidateToken });
    if (!user) return null;

    // Validación extra por expiración guardada
    if (user.tokenExpiresAt && user.tokenExpiresAt.getTime() <= Date.now()) return null;

    return user;
  } catch (_e) {
    return null;
  }
};

/**
 * 🧹 Saneo recomendado al iniciar el servidor:
 * - Deja a todos en 'desconectado'
 * - Limpia token y tokenExpiresAt
 * - (Opcional) Limitar por rol si se desea
 */
BaseUserSchema.statics.resetSessionsOnBoot = async function (role = null) {
  const filter = role ? { role } : {};
  await this.updateMany(
    { ...filter, estado: "conectado" },
    { $set: { estado: "desconectado" }, $unset: { token: "", tokenExpiresAt: "" } }
  );
};

module.exports = mongoose.models.User || mongoose.model("User", BaseUserSchema);
