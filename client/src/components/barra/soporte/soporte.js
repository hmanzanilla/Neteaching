// components/barra/soporte/soporte.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './soporte.css';

const Soporte = () => {
  const [form, setForm] = useState({
    categoria: 'Aulas y streaming',
    prioridad: 'Media',
    asunto: '',
    descripcion: '',
    correo: '',
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Abre mailto con info del ticket (rápido para esta fase)
  const onSubmit = (e) => {
    e.preventDefault();
    const to = 'soporte@neteaching.com';
    const subject = encodeURIComponent(`[${form.categoria}] (${form.prioridad}) ${form.asunto || 'Incidencia/consulta'}`);
    const body = encodeURIComponent(
      `Correo del remitente: ${form.correo}\n` +
      `Categoría: ${form.categoria}\n` +
      `Prioridad: ${form.prioridad}\n\n` +
      `Descripción:\n${form.descripcion}\n\n` +
      `— Enviado desde Centro de Soporte Neteaching`
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <main className="soporte-container">
      {/* HERO */}
      <section className="sp-hero">
        <h1>Centro de Soporte</h1>
        <p className="sp-hero-sub">
          ¿Problemas con <strong>aulas</strong>, <strong>streaming</strong>, <strong>simuladores</strong> o
          <strong> libros interactivos</strong>? Aquí tienes guías, diagnósticos y contacto con nuestro equipo.
        </p>
        <div className="sp-hero-ctas">
          <a className="sp-btn sp-btn--primary" href="mailto:soporte@neteaching.com">Escribir a soporte</a>
          <Link className="sp-btn sp-btn--ghost" to="/recursos">Ver documentación</Link>
        </div>
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section className="sp-cards" aria-label="Accesos rápidos de soporte">
        <article className="sp-card">
          <div className="sp-icon">📘</div>
          <h2>Guías y documentación</h2>
          <p>Primeros pasos, mejores prácticas y tutoriales.</p>
          <Link to="/recursos" className="sp-link">Ir a Recursos</Link>
        </article>

        <article className="sp-card">
          <div className="sp-icon">📡</div>
          <h2>Estado del sistema</h2>
          <p>Disponibilidad de streaming, pizarrón y grabaciones.</p>
          <a className="sp-link" href="#">Ver estado</a>
        </article>

        <article className="sp-card">
          <div className="sp-icon">🛠️</div>
          <h2>Diagnóstico rápido</h2>
          <p>Pasos para resolver incidencias comunes.</p>
          <a className="sp-link" href="#diagnostico">Ir al diagnóstico</a>
        </article>

        <article className="sp-card sp-card--accent">
          <div className="sp-icon">🎫</div>
          <h2>Crear ticket</h2>
          <p>Contáctanos con los detalles técnicos de tu caso.</p>
          <a className="sp-btn sp-btn--mini sp-btn--primary" href="#ticket">Abrir ticket</a>
          <div className="sp-badge">Prioritario</div>
        </article>
      </section>

      {/* DIAGNÓSTICO RÁPIDO */}
      <section id="diagnostico" className="sp-diagnostico">
        <h3>Diagnóstico rápido</h3>
        <div className="sp-diag-grid">
          <details className="sp-diag">
            <summary>No se ve el video/streaming</summary>
            <ul>
              <li>Revisa conexión y ancho de banda (&gt; 5 Mbps).</li>
              <li>Permite cámara/micrófono en el navegador.</li>
              <li>Cierra otros programas que usen la cámara.</li>
              <li>Prueba en ventana de incógnito o con otro navegador.</li>
            </ul>
          </details>

          <details className="sp-diag">
            <summary>Retraso o cortes en la clase</summary>
            <ul>
              <li>Baja la resolución del streaming en el aula.</li>
              <li>Conéctate por cable o acerca el equipo al router.</li>
              <li>Evita subir/descargar archivos pesados durante la sesión.</li>
            </ul>
          </details>

          <details className="sp-diag">
            <summary>No carga un simulador</summary>
            <ul>
              <li>Actualiza el navegador a la última versión.</li>
              <li>Desactiva extensiones de bloqueo temporalmente.</li>
              <li>Borra caché e intenta nuevamente.</li>
            </ul>
          </details>

          <details className="sp-diag">
            <summary>Problemas con libros interactivos</summary>
            <ul>
              <li>Verifica permisos/licencias vigentes en el aula.</li>
              <li>Comprueba que el material esté asignado al grupo.</li>
              <li>Revisa fecha/hora del sistema (para evaluaciones).</li>
            </ul>
          </details>
        </div>
      </section>

      {/* FORMULARIO DE TICKET */}
      <section id="ticket" className="sp-ticket">
        <h3>Crear un ticket</h3>
        <form className="sp-form" onSubmit={onSubmit}>
          <div className="sp-row">
            <div className="sp-field">
              <label>Correo de contacto</label>
              <input
                type="email"
                name="correo"
                placeholder="tucorreo@dominio.com"
                value={form.correo}
                onChange={onChange}
                required
              />
            </div>
            <div className="sp-field">
              <label>Categoría</label>
              <select name="categoria" value={form.categoria} onChange={onChange}>
                <option>Aulas y streaming</option>
                <option>Simuladores</option>
                <option>Libros interactivos</option>
                <option>Analítica y reportes</option>
                <option>Acceso y cuentas</option>
                <option>Facturación</option>
              </select>
            </div>
            <div className="sp-field">
              <label>Prioridad</label>
              <select name="prioridad" value={form.prioridad} onChange={onChange}>
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
                <option>Crítica</option>
              </select>
            </div>
          </div>

          <div className="sp-row">
            <div className="sp-field sp-field--full">
              <label>Asunto</label>
              <input
                type="text"
                name="asunto"
                placeholder="Ej. No se escucha audio en Aula Física 2"
                value={form.asunto}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="sp-field sp-field--full">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              rows="5"
              placeholder="Describe el problema, aula afectada, fecha/hora y cualquier mensaje de error."
              value={form.descripcion}
              onChange={onChange}
              required
            />
          </div>

          <button type="submit" className="sp-btn sp-btn--primary">Enviar ticket por correo</button>
          <p className="sp-help">
            Se abrirá tu cliente de correo con la información prellenada para <a href="mailto:soporte@neteaching.com">soporte@neteaching.com</a>.
          </p>
        </form>
      </section>

      {/* HORARIOS Y CANALES */}
      <section className="sp-extra">
        <div className="sp-box">
          <h4>Horario de atención</h4>
          <p>Lunes a Viernes · 9:00–18:00 (CDMX). Tiempo de respuesta estándar: &lt; 24 h hábiles.</p>
        </div>
        <div className="sp-box">
          <h4>Otros canales</h4>
          <p>
            <a href="mailto:soporte@neteaching.com">Correo</a> ·{' '}
            <a href="tel:+525512345678">Teléfono</a> ·{' '}
            <Link to="/contacto">Formulario de contacto</Link>
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="sp-cta">
        <h3>¿Necesitas una demo guiada?</h3>
        <div className="sp-cta-actions">
          <Link to="/contacto" className="sp-btn sp-btn--ghost">Hablar con un asesor</Link>
          <Link to="/precios" className="sp-btn sp-btn--primary">Ver planes</Link>
        </div>
      </section>
    </main>
  );
};

export default Soporte;
