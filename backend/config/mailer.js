/**
 * 📧 mailer.js
 * Configuración centralizada para el envío de correos desde Neteaching.
 * Compatible con Brevo (SMTP) y Gmail (fallback en desarrollo).
 */

const nodemailer = require("nodemailer");
const winston = require("winston");
require("dotenv").config();

/* ---------------------------------------------------
   🧠 CONFIGURACIÓN DE LOGS
--------------------------------------------------- */
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: "logs/email.log" }),
    new winston.transports.Console(),
  ],
});

/* ---------------------------------------------------
   ⚙️ DETECCIÓN AUTOMÁTICA DE TRANSPORTE
--------------------------------------------------- */
const hasSMTP =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const hasGmail =
  process.env.GMAIL_USER && process.env.GMAIL_PASS && !hasSMTP;

let transporter;

if (hasSMTP) {
  // 🚀 Configuración Brevo u otro SMTP personalizado
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true" ? true : false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }, // Evita bloqueos en Render o SSL mixto
  });
  logger.info(`📨 Usando transporte SMTP personalizado (${process.env.SMTP_HOST})`);
} else if (hasGmail) {
  // ☁️ Fallback para entorno de desarrollo
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
  logger.info("📨 Usando transporte Gmail (modo desarrollo)");
} else {
  logger.error("❌ No hay configuración SMTP ni Gmail disponible");
  throw new Error("Faltan credenciales de correo electrónico (SMTP o Gmail)");
}

/* ---------------------------------------------------
   💌 CONFIGURACIÓN DEL REMITENTE
--------------------------------------------------- */
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Equipo Neteaching";
const MAIL_FROM_EMAIL =
  process.env.MAIL_FROM_EMAIL ||
  process.env.SMTP_USER ||
  process.env.GMAIL_USER ||
  "no-reply@neteaching.com";

/* ---------------------------------------------------
   ✉️ FUNCIÓN GENERAL DE ENVÍO DE CORREOS
--------------------------------------------------- */
async function sendEmail(to, subject, text, html = "") {
  if (!to || !subject || !text) {
    logger.warn("⚠️ Intento de envío con datos incompletos");
    throw new Error("Faltan datos: destinatario, asunto o mensaje");
  }

  const mailOptions = {
    from: `"${MAIL_FROM_NAME}" <${MAIL_FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Correo enviado a ${to} (${subject})`);
    return info;
  } catch (error) {
    logger.error(`❌ Error al enviar correo a ${to}: ${error.message}`);
    throw new Error("Error al enviar correo");
  }
}

/* ---------------------------------------------------
   🤝 CORREO DE BIENVENIDA AUTOMÁTICO
--------------------------------------------------- */
async function sendWelcomeEmail(to, name = "") {
  if (!to) {
    logger.warn("⚠️ Intento de enviar correo de bienvenida sin dirección");
    return;
  }

  const subject = "Bienvenido a Neteaching";
  const text = `Hola ${name || ""}, bienvenido a Neteaching. Estamos encantados de que te unas a nuestra comunidad.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #004aad;">¡Bienvenido a Neteaching!</h2>
      <p>Hola ${name || "usuario"},</p>
      <p>Estamos encantados de darte la bienvenida a nuestra comunidad educativa.</p>
      <p>Explora, aprende y enseña con nosotros en 
        <a href="https://neteaching.com" style="color:#004aad; text-decoration:none;">neteaching.com</a>.
      </p>
      <br>
      <p>Atentamente,</p>
      <strong>${MAIL_FROM_NAME}</strong>
    </div>
  `;

  return await sendEmail(to, subject, text, html);
}

/* ---------------------------------------------------
   🧩 EXPORTACIÓN
--------------------------------------------------- */
module.exports = { sendEmail, sendWelcomeEmail };


