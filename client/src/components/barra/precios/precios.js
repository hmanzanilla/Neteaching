// components/barra/precios.js
import React from 'react';
import { Link } from 'react-router-dom';
import './precios.css';

const Precios = () => {
  return (
    <main className="precios-container">
      {/* HERO */}
      <section className="pr-hero">
        <h1>Precios</h1>
        <p className="pr-hero-sub">
          Planes simples y transparentes para <strong>docentes</strong>, <strong>escuelas</strong> y
          <strong> universidades</strong>. Paga mensual o ahorra con pago anual.
        </p>
        <p className="pr-legend">Moneda: MXN · Precios antes de impuestos</p>
      </section>

      {/* PLANES */}
      <section className="pr-plans">
        {/* Docente */}
        <article className="pr-card">
          <header className="pr-card-head">
            <h2>Docente</h2>
            <p className="pr-sub">Para profesores independientes</p>
          </header>
          <div className="pr-price">
            <div className="pr-price-row"><span>Mensual</span><strong>$199</strong><span>/mes</span></div>
            <div className="pr-price-row pr-muted"><span>Anual</span><strong>$149</strong><span>/mes*</span></div>
          </div>
          <ul className="pr-list">
            <li>1 docente · hasta 5 aulas activas</li>
            <li>Hasta 100 alumnos</li>
            <li>20 h de streaming/mes</li>
            <li>50 GB de almacenamiento</li>
            <li>Pizarrón + clases en vivo</li>
            <li>Simuladores y libros propios</li>
            <li>Soporte por correo</li>
          </ul>
          <div className="pr-ctas">
            <Link to="/registro" className="pr-btn pr-btn--primary">Crear mi aula</Link>
            <Link to="/productos/aulas-virtuales" className="pr-btn pr-btn--ghost">Ver aulas</Link>
          </div>
        </article>

        {/* Escuela */}
        <article className="pr-card pr-card--accent">
          <header className="pr-card-head">
            <h2>Escuela</h2>
            <p className="pr-sub">Para instituciones pequeñas y medianas</p>
          </header>
          <div className="pr-price">
            <div className="pr-price-row"><span>Mensual</span><strong>$1,099</strong><span>/mes</span></div>
            <div className="pr-price-row pr-muted"><span>Anual</span><strong>$899</strong><span>/mes*</span></div>
          </div>
          <ul className="pr-list">
            <li>Hasta 25 docentes · 50 aulas activas</li>
            <li>Hasta 800 alumnos</li>
            <li>300 h de streaming/mes</li>
            <li>500 GB de almacenamiento</li>
            <li>Marca y colores de la escuela</li>
            <li>Analítica por grupo y curso</li>
            <li>Soporte prioritario (24 h hábiles)</li>
          </ul>
          <div className="pr-ctas">
            <Link to="/contacto" className="pr-btn pr-btn--primary">Solicitar demo</Link>
            <Link to="/productos/plataforma" className="pr-btn pr-btn--ghost">Cómo funciona</Link>
          </div>
          <div className="pr-badge">Más popular</div>
        </article>

        {/* Universidad */}
        <article className="pr-card">
          <header className="pr-card-head">
            <h2>Universidad</h2>
            <p className="pr-sub">Para facultades y redes académicas</p>
          </header>
          <div className="pr-price">
            <div className="pr-price-row"><span>Mensual</span><strong>$4,799</strong><span>/mes</span></div>
            <div className="pr-price-row pr-muted"><span>Anual</span><strong>$3,999</strong><span>/mes*</span></div>
          </div>
          <ul className="pr-list">
            <li>Hasta 150 docentes · 300 aulas activas</li>
            <li>Hasta 5,000 alumnos</li>
            <li>2,500 h de streaming/mes</li>
            <li>2 TB de almacenamiento</li>
            <li>Reportes avanzados y exportaciones</li>
            <li>SLA 99.9% · Soporte dedicado</li>
            <li>Opcional: SSO y marca blanca completa</li>
          </ul>
          <div className="pr-ctas">
            <Link to="/contacto" className="pr-btn pr-btn--primary">Pedir cotización</Link>
            <Link to="/productos/analitica" className="pr-btn pr-btn--ghost">Ver analítica</Link>
          </div>
        </article>

        {/* Enterprise */}
        <article className="pr-card">
          <header className="pr-card-head">
            <h2>Enterprise</h2>
            <p className="pr-sub">A la medida · multi-campus</p>
          </header>
          <div className="pr-price">
            <div className="pr-price-row"><span>Personalizado</span></div>
          </div>
             <ul className="pr-list">
              <li>Volúmenes &gt; 5,000 alumnos</li>
              <li>SSO / SAML · SCIM · Integraciones</li>
              <li>VPC / región dedicada (opcional)</li>
              <li>SLA 99.95% y soporte 24/7</li>
              <li>Marketplace y catálogos por campus</li>
              <li>Onboarding y training incluidos</li>
             </ul>
          <div className="pr-ctas">
            <Link to="/contacto" className="pr-btn pr-btn--primary">Hablar con ventas</Link>
            <Link to="/productos/marketplace" className="pr-btn pr-btn--ghost">Marketplace</Link>
          </div>
        </article>
      </section>

      <p className="pr-note">*Pago anual por adelantado.</p>

      {/* INCLUYE EN TODOS LOS PLANES */}
      <section className="pr-includes">
        <h3>Todos los planes incluyen</h3>
        <div className="pr-include-grid">
          <div className="inc">Pizarrón interactivo + streaming</div>
          <div className="inc">Aulas por materia y grupo</div>
          <div className="inc">Materiales por aula (PDF, video, enlaces)</div>
          <div className="inc">Simuladores y libros propios</div>
          <div className="inc">Cuestionarios y tareas</div>
          <div className="inc">Analítica básica por alumno</div>
          <div className="inc">Grabación de sesiones</div>
          <div className="inc">Soporte y actualizaciones</div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="pr-addons">
        <h3>Add-ons y consumos</h3>
        <div className="addons-grid">
          <div className="adn-card">
            <h4>Streaming adicional</h4>
            <p>$25 MXN por hora adicional</p>
            <p className="adn-muted">Se suma al paquete incluido en tu plan.</p>
          </div>
          <div className="adn-card">
            <h4>Almacenamiento extra</h4>
            <p>$120 MXN por 100 GB/mes</p>
            <p className="adn-muted">Para grabaciones y materiales pesados.</p>
          </div>
          <div className="adn-card">
            <h4>Soporte Premium</h4>
            <p>+ $1,500 MXN/mes</p>
            <p className="adn-muted">Tiempo de respuesta &lt; 4 h hábiles.</p>
          </div>
          <div className="adn-card">
            <h4>SSO / SAML</h4>
            <p>+ $2,000 MXN/mes</p>
            <p className="adn-muted">+ costo de implementación única.</p>
          </div>
          <div className="adn-card">
            <h4>Marca blanca completa</h4>
            <p>+ $1,000 MXN/mes</p>
            <p className="adn-muted">$4,000 MXN setup inicial.</p>
          </div>
          <div className="adn-card">
            <h4>Marketplace</h4>
            <p>desde $39 MXN/alumno·asignatura·mes</p>
            <p className="adn-muted">Precio varía según editorial/autor.</p>
          </div>
        </div>
      </section>

      {/* COMPARATIVA */}
      <section className="pr-compare">
        <h3>Comparativa rápida</h3>
        <div className="cmp-grid">
          <div className="cmp-head"></div>
          <div className="cmp-head">Docente</div>
          <div className="cmp-head">Escuela</div>
          <div className="cmp-head">Universidad</div>

          <div className="cmp-row">Docentes</div>
          <div className="cmp-cell">1</div>
          <div className="cmp-cell">hasta 25</div>
          <div className="cmp-cell">hasta 150</div>

          <div className="cmp-row">Aulas activas</div>
          <div className="cmp-cell">5</div>
          <div className="cmp-cell">50</div>
          <div className="cmp-cell">300</div>

          <div className="cmp-row">Alumnos</div>
          <div className="cmp-cell">100</div>
          <div className="cmp-cell">800</div>
          <div className="cmp-cell">5,000</div>

          <div className="cmp-row">Streaming/mes</div>
          <div className="cmp-cell">20 h</div>
          <div className="cmp-cell">300 h</div>
          <div className="cmp-cell">2,500 h</div>

          <div className="cmp-row">Almacenamiento</div>
          <div className="cmp-cell">50 GB</div>
          <div className="cmp-cell">500 GB</div>
          <div className="cmp-cell">2 TB</div>

          <div className="cmp-row">Analítica</div>
          <div className="cmp-cell">Básica</div>
          <div className="cmp-cell">Por grupo</div>
          <div className="cmp-cell">Avanzada</div>

          <div className="cmp-row">SLA</div>
          <div className="cmp-cell">—</div>
          <div className="cmp-cell">99.9%</div>
          <div className="cmp-cell">99.9%</div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pr-faq">
        <h3>Preguntas frecuentes</h3>
        <details>
          <summary>¿Puedo cambiar de plan en cualquier momento?</summary>
          <p>Sí. El cambio se prorratea en el siguiente ciclo.</p>
        </details>
        <details>
          <summary>¿Qué pasa si supero horas de streaming o almacenamiento?</summary>
          <p>Se cobra el excedente según los add-ons. Puedes configurar alertas y topes.</p>
        </details>
        <details>
          <summary>¿Cómo se licencian los materiales del Marketplace?</summary>
          <p>Por alumno y asignatura. El precio depende de la editorial/autor y aparece antes de activar la licencia.</p>
        </details>
        <details>
          <summary>¿Ofrecen descuentos para organizaciones públicas?</summary>
          <p>Sí, contáctanos para aplicar convenios y volumen.</p>
        </details>
      </section>

      {/* CTA */}
      <section className="pr-cta">
        <h3>¿Listo para empezar?</h3>
        <div className="pr-cta-actions">
          <Link to="/registro" className="pr-btn pr-btn--primary">Crear mi aula</Link>
          <Link to="/contacto" className="pr-btn pr-btn--ghost">Hablar con un asesor</Link>
        </div>
      </section>
    </main>
  );
};

export default Precios;

