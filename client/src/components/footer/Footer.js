// src/components/footer/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="footer-brand">Neteaching</div>
          <p className="footer-tag">Aulas, simuladores y libros interactivos.</p>
        </div>

        <div className="footer-col">
          <div className="footer-title">Explora</div>
          <ul>
            <li><Link to="/productos">Productos</Link></li>
            <li><Link to="/precios">Precios</Link></li>
            <li><Link to="/clientes">Clientes</Link></li>
            <li><Link to="/recursos">Recursos</Link></li>
            <li><Link to="/soporte">Soporte</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <div className="footer-title">Compañía</div>
          <ul>
            <li><Link to="/conocenos">Conócenos</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/privacidad">Privacidad</Link></li>
            {/* Cuando tengas /terminos, lo agregas aquí */}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Neteaching. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
};

export default Footer;
