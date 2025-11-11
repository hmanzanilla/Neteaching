// paymentService.js
const User = require('../models/User_alumno'); // Importa el modelo de usuario

/**
 * Función para simular el procesamiento de un pago
 * y actualizar el estado del usuario a 'active'.
 * @param {string} userId - El ID del usuario.
 */
const processPayment = async (userId) => {
  try {
    // Simulación de un proceso de pago
    const paymentSuccessful = true; // Esto simula que el pago fue exitoso

    if (paymentSuccessful) {
      // Actualizar el estado del usuario en la base de datos a 'active'
      const user = await User.findByIdAndUpdate(userId, { status: 'active' }, { new: true });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return { success: true, message: 'Pago procesado y estado actualizado', user };
    } else {
      throw new Error('Error en el procesamiento del pago');
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  processPayment,
};
