// models/User_admin_principal.js
const mongoose = require("mongoose");
const User = require("./User"); // Modelo base común

// Puedes agregar campos adicionales si los necesitas más adelante
const AdminPrincipalSchema = new mongoose.Schema({});

// Creamos el discriminador para 'admin_principal'
const UserAdminPrincipal = User.discriminator("admin_principal", AdminPrincipalSchema);

module.exports = UserAdminPrincipal;