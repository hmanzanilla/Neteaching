//routes/emailroutes.js
const express = require('express');
const router = express.Router();
const sendEmail = require('../config/mailer');
const { authenticate } = require('../middlewares/auth'); // ✅ Middleware de autenticación

// Middleware para validar la entrada de datos del correo
const validateEmailInput = (req, res, next) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Todos los campos (to, subject, message) son obligatorios' });
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'El correo destino no es válido' });
  }

  next();
};

// Ruta protegida para enviar correos electrónicos
router.post('/send-email', authenticate, validateEmailInput, async (req, res) => {
  const { to, subject, message } = req.body;

  // Dirección del remitente desde el .env (usamos GMAIL_USER)
  const senderEmail = process.env.GMAIL_USER || 'noreply@neteaching.com';

  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: { Data: message },
      },
      Subject: { Data: subject },
    },
    Source: senderEmail,
  };

  try {
    const data = await sendEmail(params);
    console.log(`✅ Correo enviado a ${to}:`, data);

    res.status(200).json({ message: 'Correo enviado con éxito' });
  } catch (err) {
    console.error('❌ Error al enviar el correo:', err);
    res.status(500).json({ error: 'Error al enviar el correo', details: err.message });
  }
});

module.exports = router;
