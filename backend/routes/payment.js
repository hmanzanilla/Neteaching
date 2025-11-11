// routes/payment.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Importa mongoose para manejar ObjectId
const User = require('../models/User_alumno'); // Asegúrate de tener el modelo de usuario
const { authenticate } = require('../middlewares/auth'); // Middleware para autenticar

// Ruta para procesar el pago y actualizar el estado del usuario
router.put('/process/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  // Log para verificar que se recibe la solicitud correctamente
  console.log('Solicitud para procesar el pago para el usuario con ID:', userId);

  try {
    // Verificar si el ID del usuario es válido
    const validUserId = mongoose.Types.ObjectId.isValid(userId);
    console.log('¿ID del usuario válido?:', validUserId);

    if (!validUserId) {
      console.error('ID de usuario no es válido:', userId);
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }

    // Intentar encontrar el usuario en la base de datos
    const user = await User.findById(userId);
    console.log('Usuario encontrado en la base de datos:', user ? user.email : 'Usuario no encontrado');

    if (!user) {
      console.error('No se encontró el usuario con ID:', userId);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar el estado del usuario a 'active'
    const updatedUser = await User.findByIdAndUpdate(userId, { status: 'active' }, { new: true });
    console.log('Estado del usuario actualizado a active:', updatedUser ? updatedUser.email : 'No se pudo actualizar el usuario');

    // Si el pago es exitoso, devolver una respuesta exitosa
    res.status(200).json({ message: 'Estado actualizado con éxito', user: updatedUser });
  } catch (error) {
    // En caso de error, registrar el error en la consola
    console.error('Error al procesar el pago:', error);
    res.status(500).json({ message: 'Error al procesar el pago' });
  }
});

module.exports = router;
