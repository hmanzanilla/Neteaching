// components/barra/contacto.js
import React, { useState } from 'react';
import './contacto.css';

const Contacto = () => {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    motivo: 'Ventas',
    asunto: '',
    mensaje: '',
  });

  const correos = {
    Ventas: 'ventas@neteaching.com',
    Soporte: 'soporte@neteaching.com',
    Alianzas: 'alianzas@neteaching.com',
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Abre el cliente de correo con la info del formulario (no requiere backend)
  const onSubmit = (e) => {
    e.preventDefault();
    const to = correos[form.motivo] || correos.Ventas;
    const subject = encodeURIComponent(`[${form.motivo}] ${form.asunto || 'Consulta desde Neteaching'}`);
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\nEmail: ${form.email}\nMotivo: ${form.motivo}\n\n${form.mensaje}\n\n— Enviado desde Neteaching`
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <main className="contacto-container">
      {/* HERO */}
      <section className="ct-hero">
        <h1>Contacto</h1>
        <p className="ct-hero-sub">
          ¿Tienes dudas sobre <strong>escuelas virtuales</strong>, <strong>aulas</strong>,
          <strong> simuladores</strong> o <strong>libros interactivos</strong>? Estamos para ayudarte.
        </p>
      </section>

      {/* TARJETAS DE CONTACTO */}
      <section className="ct-cards">
        <article className="ct-card">
          <div className="ct-icon">💼</div>
          <h2>Ventas</h2>
          <p>Cotizaciones, demos y planes para docentes y organizaciones.</p>
          <ul className="ct-list">
            <li><a href="mailto:ventas@neteaching.com">ventas@neteaching.com</a></li>
            <li><a href="tel:+525512345678">+52 55 1234 5678</a></li>
          </ul>
        </article>

        <article className="ct-card">
          <div className="ct-icon">🛠️</div>
          <h2>Soporte técnico</h2>
          <p>Ayuda con aulas, streaming, pizarrón y materiales.</p>
          <ul className="ct-list">
            <li><a href="mailto:soporte@neteaching.com">soporte@neteaching.com</a></li>
            <li>Lun–Vie · 9:00–18:00 (CDMX)</li>
          </ul>
        </article>

        <article className="ct-card">
          <div className="ct-icon">🤝</div>
          <h2>Alianzas</h2>
          <p>Editoriales, autores y convenios institucionales.</p>
          <ul className="ct-list">
            <li><a href="mailto:alianzas@neteaching.com">alianzas@neteaching.com</a></li>
            <li><a href="/productos/marketplace">Marketplace de contenidos</a></li>
          </ul>
        </article>
      </section>

      {/* FORMULARIO */}
      <section className="ct-form-wrap">
        <h3>Escríbenos</h3>
        <form className="ct-form" onSubmit={onSubmit}>
          <div className="ct-row">
            <div className="ct-field">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                required
                placeholder="Tu nombre completo"
              />
            </div>
            <div className="ct-field">
              <label>Correo</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                placeholder="tucorreo@dominio.com"
              />
            </div>
          </div>

          <div className="ct-row">
            <div className="ct-field">
              <label>Motivo</label>
              <select name="motivo" value={form.motivo} onChange={onChange}>
                <option>Ventas</option>
                <option>Soporte</option>
                <option>Alianzas</option>
              </select>
            </div>
            <div className="ct-field">
              <label>Asunto</label>
              <input
                type="text"
                name="asunto"
                value={form.asunto}
                onChange={onChange}
                placeholder="Sobre qué trata tu consulta"
              />
            </div>
          </div>

          <div className="ct-field">
            <label>Mensaje</label>
            <textarea
              name="mensaje"
              rows="5"
              value={form.mensaje}
              onChange={onChange}
              placeholder="Cuéntanos brevemente cómo podemos ayudarte"
              required
            />
          </div>

          <button type="submit" className="ct-btn ct-btn--primary">Enviar mensaje</button>
        </form>
        <p className="ct-help">
          Al enviar, se abrirá tu cliente de correo con la información prellenada. También puedes escribirnos directamente a
          <a href="mailto:contacto@neteaching.com"> contacto@neteaching.com</a>.
        </p>
      </section>

      {/* INFO EXTRA / UBICACIÓN (opcional) */}
      <section className="ct-extra">
        <div className="ct-box">
          <h4>Horario de atención</h4>
          <p>Lunes a Viernes · 9:00–18:00 (CDMX)</p>
        </div>
        <div className="ct-box">
          <h4>Redes</h4>
          <p>
            <a href="#" aria-label="Facebook">Facebook</a> ·{' '}
            <a href="#" aria-label="YouTube">YouTube</a> ·{' '}
            <a href="#" aria-label="X/Twitter">X</a>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Contacto;



