// backend/models/User.js
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const options = {
  discriminatorKey: "role",
  collection: "users",
  timestamps: true,
};

const BaseUserSchema = new mongoose.Schema(
  {
    // Identificación / auth
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    username: { type: String, required: true, unique: true, trim: true },

    // Datos generales
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
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

    // Estado de cuenta
    status: { type: String, enum: ["pending", "active"], default: "pending" },

    // Control de sesión / revocación
    token: { type: String, default: null },
    // Fecha de expiración del token (NO TTL a nivel colección)
    tokenExpiresAt: { type: Date, default: null },

    // Presencia / sesión única
    estado: { type: String, enum: ["desconectado", "conectado"], default: "desconectado" },
    lastSeenAt: { type: Date, default: null },
  },
  options
);

// Índices útiles
BaseUserSchema.index({ email: 1 }, { unique: true });
BaseUserSchema.index({ username: 1 }, { unique: true });
BaseUserSchema.index({ curp: 1 }, { unique: true });

// Normalizar + hash
BaseUserSchema.pre("save", async function (next) {
  if (this.curp) this.curp = String(this.curp).trim().toUpperCase();

  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Métodos
BaseUserSchema.methods.comparePassword = function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

BaseUserSchema.methods.generateAuthToken = async function (opts = {}) {
  const expiresIn = opts.expiresIn || "2h";
  const token = jwt.sign(
    { userId: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  // Guardar token + expiración derivada del 'exp' del JWT
  const decoded = jwt.decode(token);
  const expDate = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 2 * 60 * 60 * 1000);

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

// Estáticos
BaseUserSchema.statics.findByToken = async function (candidateToken) {
  try {
    const decoded = jwt.verify(candidateToken, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded._id || decoded.id;
    if (!userId) return null;

    const user = await this.findOne({ _id: userId, token: candidateToken });
    if (!user) return null;
    if (user.tokenExpiresAt && user.tokenExpiresAt.getTime() <= Date.now()) return null;

    return user;
  } catch {
    return null;
  }
};

BaseUserSchema.statics.resetSessionsOnBoot = async function (role = null) {
  const filter = role ? { role } : {};
  await this.updateMany(
    { ...filter, estado: "conectado" },
    { $set: { estado: "desconectado" }, $unset: { token: "", tokenExpiresAt: "" } }
  );
};

module.exports = mongoose.models.User || mongoose.model("User", BaseUserSchema);
