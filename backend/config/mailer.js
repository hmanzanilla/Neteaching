//config/mailer.js
const nodemailer = require('nodemailer'); // Importa Nodemailer para enviar correos
require('dotenv').config(); // Importa dotenv para manejar variables de entorno
const winston = require('winston');

// ✅ Configurar el logger para registrar eventos de email
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'email.log' }),
    new winston.transports.Console(),
  ],
});

// ✅ Verificar si las credenciales están configuradas correctamente
if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  logger.error("❌ Error: Variables de entorno GMAIL_USER y GMAIL_PASS no están configuradas.");
  throw new Error("Configuración de credenciales de correo electrónico faltante");
}

// ✅ Configurar el transporte SMTP de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true", // Usa TLS si está configurado
  auth: {
    user: process.env.GMAIL_USER, // Usuario de correo
    pass: process.env.GMAIL_PASS  // Contraseña o API key segura
  },
  tls: {
    rejectUnauthorized: false // Evita problemas con certificados no verificados
  }
});

// ✅ Función genérica para enviar correos electrónicos
const sendEmail = async (to, subject, text, html = '') => {
  if (!to || !subject || !text) {
    logger.warn('⚠ Intento de envío de correo con datos incompletos');
    throw new Error('Faltan datos: dirección de destino, asunto o mensaje');
  }

  const mailOptions = {
    from: `"Neteaching Support Team" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Correo enviado con éxito a ${to}: ${info.response}`);
    return info;
  } catch (error) {
    logger.error(`❌ Error al enviar correo a ${to}: ${error.message}`);
    throw new Error("Error al enviar correo");
  }
};

// ✅ Función específica para enviar correos de bienvenida
const sendWelcomeEmail = async (to) => {
  if (!to) {
    logger.warn("⚠ Intento de enviar correo de bienvenida sin dirección");
    return;
  }

  const subject = 'Bienvenido a Neteaching';
  const text = 'Hola, bienvenido a Neteaching. Estamos encantados de que te unas a nuestra comunidad. Para más información, visita nuestro sitio web: https://neteaching.com';
  const html = `
    <h1>Bienvenido a Neteaching</h1>
    <p>Hola, estamos encantados de que te unas a nuestra comunidad.</p>
    <p>Para más información, visita nuestro sitio web: <a href="https://neteaching.com">Neteaching</a></p>
  `;

  return await sendEmail(to, subject, text, html);
};

// ✅ Exportar funciones para usarlas en otros archivos
module.exports = { sendEmail, sendWelcomeEmail };
