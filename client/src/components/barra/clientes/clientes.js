// components/barra/clientes.js
import React from 'react';
import { Link } from 'react-router-dom';
import './clientes.css';

const Clientes = () => {
  return (
    <main className="clientes-container">
      {/* HERO */}
      <section className="cl-hero">
        <h1>Clientes y Casos de Éxito</h1>
        <p className="cl-hero-sub">
          Docentes, escuelas y universidades confían en <strong>Neteaching</strong> para impartir clases en vivo,
          operar <strong>aulas virtuales</strong>, usar <strong>simuladores</strong> y distribuir
          <strong> libros interactivos</strong> con analítica de aprendizaje.
        </p>
        <div className="cl-hero-ctas">
          <Link className="cl-btn cl-btn--primary" to="/registro">Crear mi aula</Link>
          <Link className="cl-btn cl-btn--ghost" to="/productos/plataforma">Para instituciones</Link>
        </div>
      </section>

      {/* LOGOS / MARCAS */}
      <section className="cl-logos" aria-label="Organizaciones que confían en Neteaching">
        <div className="logos-grid">
          <div className="logo-skeleton">Colegio Atlas</div>
          <div className="logo-skeleton">Universidad Delta</div>
          <div className="logo-skeleton">Prepa Sigma</div>
          <div className="logo-skeleton">Instituto Prisma</div>
          <div className="logo-skeleton">Centro Newton</div>
          <div className="logo-skeleton">Academia Orion</div>
        </div>
      </section>

      {/* MÉTRICAS */}
      <section className="cl-stats">
        <div className="stat">
          <div className="stat-num">+12k</div>
          <div className="stat-label">Aulas creadas</div>
        </div>
        <div className="stat">
          <div className="stat-num">+180k</div>
          <div className="stat-label">Sesiones en vivo</div>
        </div>
        <div className="stat">
          <div className="stat-num">+1.2M</div>
          <div className="stat-label">Actividades resueltas</div>
        </div>
        <div className="stat">
          <div className="stat-num">99.9%</div>
          <div className="stat-label">Uptime de la plataforma</div>
        </div>
      </section>

      {/* CASOS */}
      <section className="cl-cases">
        <h2>Casos destacados</h2>
        <div className="case-grid">
          <article className="cl-card">
            <h3>Colegio Atlas — Bachillerato</h3>
            <p>
              Implementaron <strong>marca blanca</strong> con dominio propio. Integraron
              <strong> libros interactivos</strong> de matemáticas y <strong>simuladores</strong> en Física.
              Redujeron 38% la deserción en cursos remediales.
            </p>
            <ul className="cl-list">
              <li>50+ aulas activas al día</li>
              <li>Analítica por grupo y docente</li>
              <li>Gestión de horarios y grabaciones</li>
            </ul>
            <Link to="/productos/plataforma" className="cl-link">Ver cómo funciona</Link>
          </article>

          <article className="cl-card">
            <h3>Universidad Delta — Ingeniería</h3>
            <p>
              Cursos de Cálculo y Mecánica con <strong>simuladores</strong> personalizados.
              <strong> Evaluaciones automáticas</strong> y reportes por cohorte mejoraron la
              tasa de aprobación en primer año (+21%).
            </p>
            <ul className="cl-list">
              <li>Banco de reactivos y proctoring ligero</li>
              <li>Integración con aulas en vivo</li>
              <li>Exportación de calificaciones</li>
            </ul>
            <Link to="/productos/simuladores" className="cl-link">Explorar simuladores</Link>
          </article>

          <article className="cl-card">
            <h3>Red de Preparatorias Sigma</h3>
            <p>
              Adoptaron el <strong>Marketplace</strong> para licenciar contenidos de editoriales.
              <strong> Libros interactivos</strong> con seguimiento de lectura y tareas.
            </p>
            <ul className="cl-list">
              <li>Catálogo centralizado de materiales</li>
              <li>Licencias por campus y grupo</li>
              <li>Panel de cumplimiento y avance</li>
            </ul>
            <Link to="/productos/marketplace" className="cl-link">Conocer el marketplace</Link>
          </article>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="cl-testimonials">
        <h2>Lo que dicen nuestros usuarios</h2>
        <div className="testi-grid">
          <blockquote className="testi">
            <p>
              “El pizarrón interactivo con streaming hizo que mis clases fueran más participativas.
              Los alumnos practican con simuladores y veo el avance en tiempo real.”
            </p>
            <footer>— Laura R., Docente de Física</footer>
          </blockquote>

          <blockquote className="testi">
            <p>
              “Montamos nuestra escuela virtual en días. Marca blanca, aulas, materiales y reportes.
              La curva de adopción fue mínima para los profesores.”
            </p>
            <footer>— Dirección Académica, Colegio Atlas</footer>
          </blockquote>

          <blockquote className="testi">
            <p>
              “Los libros interactivos con ejercicios autocorregibles nos ahorran tiempo y dan datos claros
              para tutorías personalizadas.”
            </p>
            <footer>— Coordinación de Matemáticas, Universidad Delta</footer>
          </blockquote>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cl-cta">
        <h3>¿Quieres un caso como estos?</h3>
        <p>Conversemos sobre tus metas académicas y armemos un plan de implementación.</p>
        <div className="cl-hero-ctas">
          <Link className="cl-btn cl-btn--primary" to="/contacto">Hablar con un asesor</Link>
          <Link className="cl-btn cl-btn--ghost" to="/precios">Ver precios</Link>
        </div>
      </section>
    </main>
  );
};

export default Clientes;
