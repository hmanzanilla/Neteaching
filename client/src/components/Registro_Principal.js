// src/components/Registro_Principal.js

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Auth / roles (rutas privadas)
import Registro_Unificado from './Registro_Unificado';
import Login from './Login';
import Principal_Alumno from './alumno/Principal_Alumno';
import Principal_Maestro from './maestro/Principal_Maestro';
import Principal_Administrador from './administrador/Principal_Administrador';
import Principal_AdminPrincipal from './adminprincipal/Principal_AdminPrincipal';

// Pública (barra)
import Barra from './barra/Barra';
import Conocenos from './barra/conocenos/conocenos';
import Contacto from './barra/contacto/contacto';
import Productos from './barra/productos/productos';
import Precios from './barra/precios/precios';
import Clientes from './barra/clientes/clientes';
import Soporte from './barra/soporte/soporte';

// Footer / otras públicas
import Privacidad from './footer/Privacidad';
import Footer from './footer/Footer';

// Header REAL (reloj + usuario + salir) para rutas privadas
import Header from './Header';

// Extra
import HomeCarousel from './HomeCarousel';
import './Registro_Principal.css';

const Registro_Principal = () => {
  const location = useLocation();

  // ✅ Define qué rutas son "públicas"
  const RUTAS_PUBLICAS = [
    '/', '/conocenos', '/contacto', '/privacidad',
    '/productos', '/productos/aulas-virtuales', '/productos/simuladores',
    '/productos/libros-interactivos', '/productos/analitica', '/productos/marketplace',
    '/productos/plataforma', '/productos/escuela',
    '/precios', '/clientes', '/recursos', '/soporte',
    '/registro', '/login'
  ];

  // Fondo especial (home y marketing)
  const RUTAS_PUBLICAS_CON_FONDO = [
    '/', '/conocenos', '/contacto', '/privacidad',
    '/productos', '/precios', '/clientes', '/recursos', '/soporte'
  ];

  // Flags de visibilidad
  const isPublic = RUTAS_PUBLICAS.includes(location.pathname);
  const isPublicWithBg = RUTAS_PUBLICAS_CON_FONDO.includes(location.pathname);

  const showBarra  = isPublic;          // Barra solo en públicas
  const showFooter = isPublic;          // Footer solo en públicas
  const showHeader = !isPublic;         // Header solo en privadas

  // UX: subir al inicio en cada cambio de ruta pública
  useEffect(() => {
    if (isPublic) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]); // eslint-disable-line

  return (
    <div className={`registro-container ${isPublicWithBg ? 'fondo-especial' : ''}`}>
      {/* Carrusel sólo en Home */}
      {location.pathname === '/' && <HomeCarousel />}

      {/* Barra para públicas */}
      {showBarra && <Barra />}

      {/* Header REAL para privadas (reloj/usuario/salir) */}
      {showHeader && <Header />}

      <Routes>
        {/* Home (el carrusel ya se monta arriba) */}
        <Route path="/" element={<div />} />

        {/* Autenticación */}
        <Route path="registro" element={<Registro_Unificado />} />
        <Route path="login" element={<Login />} />
        <Route path="registro-success" element={<div>Registro completado con éxito. Redirigiendo...</div>} />
        <Route path="login-success" element={<div>Login completado con éxito. Redirigiendo...</div>} />

        {/* Rutas privadas por rol */}
        <Route path="alumno/*" element={<Principal_Alumno />} />
        <Route path="maestro/*" element={<Principal_Maestro />} />
        <Route path="administrador/*" element={<Principal_Administrador />} />
        <Route path="adminprincipal/*" element={<Principal_AdminPrincipal />} />

        {/* Rutas públicas existentes */}
        <Route path="/conocenos" element={<Conocenos />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/privacidad" element={<Privacidad />} />

        {/* Subrutas de Productos (placeholders por ahora) */}
        <Route path="/productos/aulas-virtuales" element={<LandingPlaceholder title="Aulas virtuales" />} />
        <Route path="/productos/simuladores" element={<LandingPlaceholder title="Simuladores interactivos" />} />
        <Route path="/productos/libros-interactivos" element={<LandingPlaceholder title="Libros interactivos" />} />
        <Route path="/productos/analitica" element={<LandingPlaceholder title="Analítica de aprendizaje" />} />
        <Route path="/productos/marketplace" element={<LandingPlaceholder title="Marketplace de contenidos" />} />
        <Route path="/productos/plataforma" element={<LandingPlaceholder title="Plataforma para instituciones" />} />
        <Route path="/productos/escuela" element={<LandingPlaceholder title="Escuela Neteaching" />} />

        {/* Recursos (placeholder temporal) */}
        <Route path="/recursos" element={<LandingPlaceholder title="Recursos" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Footer para públicas */}
      {showFooter && <Footer />}
    </div>
  );
};

/* Placeholder homogéneo para páginas aún no implementadas */
const LandingPlaceholder = ({ title }) => (
  <div className="public-landing">
    <h1>{title}</h1>
    <p>Página en construcción.</p>
  </div>
);

export default Registro_Principal;
