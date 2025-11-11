// backend/models/User_admin.js
// backend/models/User_admin.js
const mongoose = require("mongoose");
const User = require("./User"); // Modelo base compartido

// 🧠 Esquema extendido para 'administrador' (campo extra futuro si lo necesitas)
const AdministradorSchema = new mongoose.Schema({}, { _id: false });

// Discriminador: todos los docs se guardan en 'users' con role: "administrador"
const UserAdministrador = User.discriminator("administrador", AdministradorSchema);

module.exports = UserAdministrador;

