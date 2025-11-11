// models_general/bimestreActualModel.js
const mongoose = require("mongoose");

const bimestreActualSchema = new mongoose.Schema({
  bimestre: {
    type: String,
    enum: ["Primer Bimestre", "Segundo Bimestre", "Tercer Bimestre"],
    required: true,
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User_admin_principal", // ✅ Debe coincidir con el modelo registrado en User_admin_principal.js
    required: true,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  }
}, {
  collection: "bimestre_actual",
  timestamps: true
});

const BimestreActual = mongoose.model("BimestreActual", bimestreActualSchema);
module.exports = BimestreActual;
