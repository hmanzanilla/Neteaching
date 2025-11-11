// src/components/barra/Barra.js
import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import "./Barra.css";

const Barra = () => {
  // 'productos' | 'soporte' | null
  const [open, setOpen] = useState(null);
  const rootRef = useRef(null);
  const location = useLocation();

  const linkClass = ({ isActive }) =>
    `barra-link${isActive ? " active" : ""}`;

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setOpen(null);
  }, [location.pathname]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Cerrar con ESC
  const onKeyDown = (e) => {
    if (e.key === "Escape") setOpen(null);
  };

  // Primer click abre menú, segundo permite navegar
  const onToggleClick = (menu) => (e) => {
    if (open !== menu) {
      e.preventDefault();
      setOpen(menu);
    } else {
      setOpen(null);
    }
  };

  const closeAnd = (to) => ({
    to,
    className: "dropdown-item",
    role: "menuitem",
    onClick: () => setOpen(null),
  });

  return (
    <header
      className="barra"
      role="banner"
      ref={rootRef}
      onKeyDown={onKeyDown}
    >
      <div className="barra-inner" role="navigation" aria-label="Navegación principal">
        {/* Lado izquierdo: enlaces principales */}
        <nav className="barra-left">
          <NavLink to="/" end className={linkClass}>
            Inicio
          </NavLink>

          {/* Productos */}
          <div
            className={`dropdown${open === "productos" ? " open" : ""}`}
            onMouseEnter={() => setOpen("productos")}
            onMouseLeave={() => setOpen(null)}
          >
            <NavLink
              to="/productos"
              className={linkClass}
              aria-haspopup="true"
              aria-expanded={open === "productos"}
              onClick={onToggleClick("productos")}
            >
              Productos
            </NavLink>

            <div className="dropdown-menu" role="menu" aria-hidden={open !== "productos"}>
              <Link {...closeAnd("/productos/aulas-virtuales")}>Aulas virtuales</Link>
              <Link {...closeAnd("/productos/simuladores")}>Simuladores</Link>
              <Link {...closeAnd("/productos/libros-interactivos")}>Libros interactivos</Link>
              <Link {...closeAnd("/productos/analitica")}>Analítica</Link>
              <Link {...closeAnd("/productos/marketplace")}>Marketplace</Link>
              <div className="dropdown-sep" />
              <Link {...closeAnd("/productos/plataforma")}>Para instituciones</Link>
              <Link {...closeAnd("/productos/escuela")}>Escuela Neteaching</Link>
            </div>
          </div>

          <NavLink to="/precios" className={linkClass}>
            Precios
          </NavLink>
          <NavLink to="/clientes" className={linkClass}>
            Clientes
          </NavLink>
          <NavLink to="/recursos" className={linkClass}>
            Recursos
          </NavLink>

          {/* Soporte */}
          <div
            className={`dropdown${open === "soporte" ? " open" : ""}`}
            onMouseEnter={() => setOpen("soporte")}
            onMouseLeave={() => setOpen(null)}
          >
            <NavLink
              to="/soporte"
              className={linkClass}
              aria-haspopup="true"
              aria-expanded={open === "soporte"}
              onClick={onToggleClick("soporte")}
            >
              Soporte
            </NavLink>

            <div className="dropdown-menu" role="menu" aria-hidden={open !== "soporte"}>
              <Link {...closeAnd("/soporte")}>Centro de ayuda</Link>
              <Link {...closeAnd("/contacto")}>Contacto</Link>
              <Link {...closeAnd("/conocenos")}>Conócenos</Link>
            </div>
          </div>
        </nav>

        {/* Lado derecho: CTAs */}
        <div className="barra-right">
          {/* Ajusta la ruta si corresponde a tu flujo (p. ej. /crear-aula) */}
          <Link to="/registro" className="barra-cta">
            Crear mi cuenta
          </Link>
          <NavLink to="/login" className={linkClass}>
            Login
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Barra;





