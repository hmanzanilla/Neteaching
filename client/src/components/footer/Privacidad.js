// src/components/footer/Privacidad.js
import React from 'react';
import './Privacidad.css';

const Privacidad = () => {
  return (
    <main className="privacidad-container">
      <section className="pv-hero">
        <h1>Privacidad y Protección de Datos</h1>
        <p className="pv-hero-sub">
          En <strong>Neteaching</strong> cuidamos tu información. Aquí explicamos qué datos
          recopilamos, cómo los usamos y cuáles son tus derechos.
        </p>
      </section>

      <section className="pv-section">
        <h2>Qué datos recopilamos</h2>
        <ul className="pv-list">
          <li>Cuenta: nombre, correo, contraseña (encriptada).</li>
          <li>Uso académico: aulas, materiales, tareas, calificaciones.</li>
          <li>Técnicos: IP, navegador, dispositivo, cookies.</li>
          <li>Facturación (si aplica): razón social y datos fiscales.</li>
        </ul>
      </section>

      <section className="pv-section">
        <h2>Para qué los usamos</h2>
        <ul className="pv-list">
          <li>Prestar los servicios (aulas, simuladores, libros).</li>
          <li>Mejorar la plataforma y soporte.</li>
          <li>Cumplimiento legal y facturación.</li>
          <li>Envío de avisos de servicio (no spam).</li>
        </ul>
      </section>

      <section className="pv-section">
        <h2>Seguridad</h2>
        <ul className="pv-list">
          <li>HTTPS y contraseñas encriptadas.</li>
          <li>Controles de acceso por rol.</li>
          <li>Backups y continuidad.</li>
        </ul>
      </section>

      <section className="pv-section">
        <h2>Tus derechos</h2>
        <p>
          Puedes acceder, rectificar o eliminar tus datos. Escríbenos a
          {' '}<a href="mailto:privacidad@neteaching.com">privacidad@neteaching.com</a>.
        </p>
        <p className="pv-note">Última actualización: 16/09/2025</p>
      </section>
    </main>
  );
};

export default Privacidad;
