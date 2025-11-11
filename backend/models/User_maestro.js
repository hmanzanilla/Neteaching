// models/User_maestro.js
const mongoose = require("mongoose");
const User = require("./User"); // Modelo base

// 🧠 Esquema extendido para maestro (por ahora sin campos extra)
const MaestroSchema = new mongoose.Schema({});

// Usa el discriminador para extender el modelo base
const UserMaestro = User.discriminator("maestro", MaestroSchema);

module.exports = UserMaestro;
