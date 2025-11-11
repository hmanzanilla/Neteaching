// models/User_alumno.js
const mongoose = require("mongoose");
const User = require("./User");

const AlumnoSchema = new mongoose.Schema({});
const UserAlumno = User.discriminator("alumno", AlumnoSchema);

module.exports = UserAlumno;