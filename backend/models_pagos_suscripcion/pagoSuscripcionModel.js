//c:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1.3.4\models_pagos_suscripcion\pagoSuscripcionModel.js
// 📌 MODELO DE PAGO DE SUSCRIPCIONES - `pagoSuscripcionModel.js`
const mongoose = require("mongoose");

const PagoSuscripcionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_alumno", // Relacionado con la colección de usuarios
      required: true,
    },
    paquete: {
      type: String,
      enum: ["paquete_1", "paquete_2", "paquete_3"], // Mejor manejo en código
      required: true,
    },
    fecha_pago: {
      type: Date,
      default: Date.now, // Guarda la fecha automáticamente
    },
    fecha_expiracion: {
      type: Date,
      required: true, // Se calculará con base en el paquete seleccionado
    },
    estado_suscripcion: {
      type: String,
      enum: ["activo", "pendiente", "expirado", "cancelado"],
      default: "pendiente",
    },
    metodo_pago: {
      type: String,
      enum: ["Tarjeta", "PayPal", "Transferencia"],
      required: true,
    },
  },
  {
    timestamps: true, // Crea automáticamente `createdAt` y `updatedAt`
  }
);

module.exports = mongoose.model("PagoSuscripcion", PagoSuscripcionSchema);

