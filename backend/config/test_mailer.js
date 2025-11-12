/*/
 * 📧 cong/testmailer.js
 * Configuración centralizada para el envío de correos desde Neteaching.
 * Compatible con Brevo (SMTP) y Gmail (fallback en desarrollo).
 */
const { sendWelcomeEmail } = require("./mailer");

(async () => {
  try {
    await sendWelcomeEmail("tu_correo_personal@gmail.com", "Héctor");
    console.log(" Correo de prueba enviado correctamente");
  } catch (err) {
    console.error("Error al enviar:", err.message);
  }
})();

