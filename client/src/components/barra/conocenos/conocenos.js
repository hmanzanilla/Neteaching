// components/barra/conocenos/conocenos.js
import React from 'react';
import { Link } from 'react-router-dom';
import './conocenosO.css';

const Conocenos = () => {
  return (
    <main className="conocenosO-container">
      {/* HERO */}
      <section className="co-hero">
        <h1>Neteaching</h1>
        <p className="co-hero-sub">
          Plataforma educativa integral: <strong>aulas virtuales</strong>, <strong>simuladores</strong>,
          <strong> libros interactivos</strong> y <strong>analítica</strong> para escuelas, docentes y estudiantes.
        </p>
        <div className="co-hero-ctas">
          <Link className="co-btn co-btn--primary" to="/registro">Crear mi aula</Link>
          <Link className="co-btn co-btn--ghost" to="/productos/plataforma">Para instituciones</Link>
        </div>
        <div className="co-hero-mini">
          ¿Eres estudiante? Conoce la <Link to="/productos/escuela">Escuela Neteaching</Link>
        </div>
      </section>

      {/* DOS OFERTAS */}
      <section className="co-offers">
        <article className="co-card">
          <h2>Escuela Neteaching</h2>
          <p>
            Nuestra oferta educativa propia: cursos con <strong>clases en vivo</strong>, 
            <strong> simuladores</strong> y <strong>libros interactivos</strong>. Ideal para preparación UNAM, UAM, IPN y refuerzo académico.
          </p>
          <ul className="co-list">
            <li>Simuladores de Matemáticas, Física y Química</li>
            <li>Libros interactivos con evaluación automática</li>
            <li>Clases en vivo + grabaciones</li>
            <li>Seguimiento de progreso</li>
          </ul>
          <div className="co-card-ctas">
            <Link to="/productos/escuela" className="co-link">Ver más</Link>
          </div>
        </article>

        <article className="co-card">
          <h2>Plataforma para Instituciones (SaaS)</h2>
          <p>
            Crea tu <strong>propia escuela virtual</strong> con dominio y marca: 
            <strong> aulas</strong>, <strong>pizarrón + streaming</strong>, 
            <strong> materiales</strong> y <strong>analítica</strong> en una sola plataforma.
          </p>
          <ul className="co-list">
            <li>Aulas virtuales con pizarrón interactivo y streaming</li>
            <li>Gestión de usuarios, grupos y horarios</li>
            <li>Marketplace de contenidos (editoriales y autores)</li>
            <li>Marca blanca, licencias y reportes</li>
          </ul>
          <div className="co-card-ctas">
            <Link to="/productos/plataforma" className="co-link">Cómo funciona</Link>
          </div>
        </article>
      </section>

      {/* FEATURES CLAVE */}
      <section className="co-features">
        <h3>Todo lo que necesitas en un solo lugar</h3>
        <div className="co-grid">
          <div className="co-feature">
            <div className="co-icon">🎥</div>
            <h4>Aulas en vivo</h4>
            <p>Pizarrón interactivo, streaming, chat y materiales por clase.</p>
            <Link to="/productos/aulas-virtuales" className="co-mini">Ver aulas</Link>
          </div>

          <div className="co-feature">
            <div className="co-icon">🎮</div>
            <h4>Simuladores</h4>
            <p>Aprendizaje activo con visualizaciones y experimentación.</p>
            <Link to="/productos/simuladores" className="co-mini">Explorar</Link>
          </div>

          <div className="co-feature">
            <div className="co-icon">📚</div>
            <h4>Libros interactivos</h4>
            <p>Teoría + ejercicios + simulador integrado + retroalimentación.</p>
            <Link to="/productos/libros-interactivos" className="co-mini">Ver biblioteca</Link>
          </div>

          <div className="co-feature">
            <div className="co-icon">📈</div>
            <h4>Analítica</h4>
            <p>Reportes por alumno, grupo y curso para decisiones pedagógicas.</p>
            <Link to="/productos/analitica" className="co-mini">Conocer más</Link>
          </div>

          <div className="co-feature">
            <div className="co-icon">🛒</div>
            <h4>Marketplace</h4>
            <p>Licencia contenidos de editoriales y autores a tus aulas.</p>
            <Link to="/productos/marketplace" className="co-mini">Descubrir</Link>
          </div>

          <div className="co-feature">
            <div className="co-icon">🛡️</div>
            <h4>Seguridad & Privacidad</h4>
            <p>Cumplimiento y control de datos. Conoce nuestra <Link to="/privacidad">política</Link>.</p>
          </div>
        </div>
      </section>

      {/* CÓMO EMPEZAR */}
      <section className="co-steps">
        <h3>Empieza en 3 pasos</h3>
        <ol className="co-steps-list">
          <li><strong>Regístrate</strong> y crea tu primera aula.</li>
          <li><strong>Agrega contenidos</strong>: simuladores, libros o materiales propios.</li>
          <li><strong>Invita a tus alumnos</strong> y dicta clases en vivo.</li>
        </ol>
        <div className="co-steps-cta">
          <Link className="co-btn co-btn--primary" to="/registro">Crear mi aula</Link>
          <Link className="co-btn co-btn--ghost" to="/precios">Ver precios</Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="co-cta-final">
        <h3>¿Listo para transformar tu enseñanza?</h3>
        <p>Únete a Neteaching y construyamos experiencias de aprendizaje memorables.</p>
        <div className="co-hero-ctas">
          <Link className="co-btn co-btn--primary" to="/registro">Comenzar</Link>
          <Link className="co-btn co-btn--ghost" to="/contacto">Hablar con un asesor</Link>
        </div>
      </section>
    </main>
  );
};

export default Conocenos;


