// components/barra/productos/productos.js
import React from 'react';
import { Link } from 'react-router-dom';
import './productos.css';

const Productos = () => {
  return (
    <main className="productos-container">
      {/* HERO */}
      <section className="pd-hero">
        <h1>Productos Neteaching</h1>
        <p className="pd-hero-sub">
          Todo lo que necesitas para enseñar y aprender en línea:
          <strong> aulas virtuales</strong>, <strong>simuladores</strong>, 
          <strong> libros interactivos</strong>, <strong>analítica</strong> y
          <strong> marketplace</strong>. También ofrecemos plataforma para instituciones y nuestra Escuela Neteaching.
        </p>
        <div className="pd-hero-ctas">
          <Link to="/registro" className="pd-btn pd-btn--primary">Crear mi aula</Link>
          <Link to="/productos/plataforma" className="pd-btn pd-btn--ghost">Para instituciones</Link>
        </div>
      </section>

      {/* GRID DE PRODUCTOS */}
      <section className="pd-grid">
        {/* Aulas */}
        <article className="pd-card">
          <div className="pd-icon">🧑‍🏫</div>
          <h2>Aulas virtuales</h2>
          <p>Pizarrón interactivo + streaming, chat y materiales por clase.</p>
          <ul className="pd-list">
            <li>Clases en vivo y grabadas</li>
            <li>Gestión de grupos y horarios</li>
            <li>Materiales por aula</li>
          </ul>
          <div className="pd-ctas">
            <Link to="/productos/aulas-virtuales" className="pd-link">Ver más</Link>
          </div>
        </article>

        {/* Simuladores */}
        <article className="pd-card">
          <div className="pd-icon">🎮</div>
          <h2>Simuladores interactivos</h2>
          <p>Aprendizaje activo en Matemáticas, Física, Química y más.</p>
          <ul className="pd-list">
            <li>Visualización y experimentación</li>
            <li>Actividades autocorregibles</li>
            <li>Embebibles en libros y aulas</li>
          </ul>
          <div className="pd-ctas">
            <Link to="/productos/simuladores" className="pd-link">Explorar</Link>
          </div>
        </article>

        {/* Libros */}
        <article className="pd-card">
          <div className="pd-icon">📚</div>
          <h2>Libros interactivos</h2>
          <p>Teoría + ejercicios + simulador integrado con retroalimentación.</p>
          <ul className="pd-list">
            <li>Rutas de aprendizaje</li>
            <li>Evaluación automática</li>
            <li>Analítica por capítulo</li>
          </ul>
          <div className="pd-ctas">
            <Link to="/productos/libros-interactivos" className="pd-link">Ver biblioteca</Link>
          </div>
        </article>

        {/* Analítica */}
        <article className="pd-card">
          <div className="pd-icon">📈</div>
          <h2>Analítica de aprendizaje</h2>
          <p>Paneles de progreso por alumno, grupo, curso y cohorte.</p>
          <ul className="pd-list">
            <li>Reportes descargables</li>
            <li>Alertas de riesgo</li>
            <li>Exportación de calificaciones</li>
          </ul>
          <div className="pd-ctas">
            <Link to="/productos/analitica" className="pd-link">Conocer más</Link>
          </div>
        </article>

        {/* Marketplace */}
        <article className="pd-card">
          <div className="pd-icon">🛒</div>
          <h2>Marketplace de contenidos</h2>
          <p>Licencia materiales de editoriales y autores a tus aulas.</p>
          <ul className="pd-list">
            <li>Por alumno · asignatura · mes</li>
            <li>Catálogos por campus</li>
            <li>Curaduría y soporte</li>
          </ul>
          <div className="pd-ctas">
            <Link to="/productos/marketplace" className="pd-link">Descubrir</Link>
          </div>
        </article>

        {/* Plataforma para instituciones */}
        <article className="pd-card pd-card--accent">
          <div className="pd-icon">🏫</div>
          <h2>Plataforma para instituciones</h2>
          <p>Marca blanca, dominio propio, usuarios y reportes avanzados.</p>
          <ul className="pd-list">
            <li>Multi-campus y roles</li>
            <li>SSO / SAML (opcional)</li>
            <li>SLA y soporte dedicado</li>
          </ul>
          <div className="pd-ctas">
            <Link to="/productos/plataforma" className="pd-btn pd-btn--mini pd-btn--primary">Solicitar demo</Link>
          </div>
          <div className="pd-badge">SaaS</div>
        </article>

        {/* Escuela Neteaching */}
        <article className="pd-card">
          <div className="pd-icon">🎓</div>
          <h2>Escuela Neteaching</h2>
          <p>Cursos listos con simuladores, libros y clases en vivo.</p>
          <ul className="pd-list">
            <li>Preparación UNAM, UAM, IPN</li>
            <li>Refuerzo por materias</li>
            <li>Seguimiento personalizado</li>
          </ul>
          <div className="pd-ctas">
            <Link to="/productos/escuela" className="pd-link">Ver oferta</Link>
          </div>
        </article>
      </section>

      {/* BENEFICIOS TRANSVERSALES */}
      <section className="pd-benefits">
        <h3>Beneficios de usar Neteaching</h3>
        <div className="pd-benefits-grid">
          <div className="pd-benefit">Todo integrado: aulas, libros, simuladores y tareas</div>
          <div className="pd-benefit">Analítica para decisiones pedagógicas</div>
          <div className="pd-benefit">Escalable de un docente a una universidad</div>
          <div className="pd-benefit">Seguridad y privacidad con buenas prácticas</div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="pd-usecases">
        <h3>Casos de uso</h3>
        <div className="pd-use-grid">
          <article className="pd-use">
            <h4>Docente independiente</h4>
            <p>Crea tu aula, agrega materiales y da clases en vivo con pizarrón.</p>
            <Link to="/registro" className="pd-link">Crear mi aula</Link>
          </article>
          <article className="pd-use">
            <h4>Escuela privada</h4>
            <p>Gestiona docentes, grupos y catálogos de contenidos con tu marca.</p>
            <Link to="/productos/plataforma" className="pd-link">Ver plataforma</Link>
          </article>
          <article className="pd-use">
            <h4>Universidad</h4>
            <p>Analítica por cohorte, SSO y multi-campus. SLA y soporte dedicado.</p>
            <Link to="/contacto" className="pd-link">Hablar con ventas</Link>
          </article>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pd-cta">
        <h3>¿Listo para comenzar?</h3>
        <div className="pd-cta-actions">
          <Link to="/registro" className="pd-btn pd-btn--primary">Crear mi aula</Link>
          <Link to="/contacto" className="pd-btn pd-btn--ghost">Solicitar demo</Link>
        </div>
      </section>
    </main>
  );
};

export default Productos;
