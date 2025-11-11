// client/src/components/adminprincipal/ruta4/horariosgrupos/horarioGrupos.js
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import CreaGrupos from './creaGrupos/creaGrupos';
import VerGrupos from './verGrupos/verGrupos';
import './horarioGrupos.css';

export default function HorarioGrupos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rutaActual, setRutaActual] = useState(location.pathname);

  useEffect(() => {
    setRutaActual(location.pathname);
  }, [location.pathname]);

  const handleNavigate = (subruta) => {
    const nuevaRuta = `/adminprincipal/horario-grupos/${subruta}`;
    navigate(nuevaRuta);
  };

  const esVistaInterna = rutaActual.includes('/creaGrupos') || rutaActual.includes('/verGrupos');

  return (
    <div className={`horario-grupos-container ${esVistaInterna ? 'sin-botones' : ''}`}>
      <h1>Gestión de Grupos</h1>

      {!esVistaInterna && (
        <div className="botones-grupos">
          <button onClick={() => handleNavigate('creaGrupos')}>
            Crear un Grupo
          </button>
          <button onClick={() => handleNavigate('verGrupos')}>
            Ver los Grupos
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<p>Selecciona una opción</p>} />
        <Route path="creaGrupos" element={<CreaGrupos />} />
        <Route path="verGrupos" element={<VerGrupos />} />
      </Routes>
    </div>
  );
}