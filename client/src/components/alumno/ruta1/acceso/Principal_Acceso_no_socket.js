// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\acceso\Principal_Acceso.js
// Principal_Acceso.js
// Principal_Acceso.js
import React from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Cuestionario from './cuestionario/Cuestionario';
import './Principal_Acceso.css';

const AccesoMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="acceso-container">
      <h1 className="acceso-titulo">Bienvenida/o a Neteaching</h1>
      <p className="acceso-descripcion">Selecciona una opción para continuar:</p>

      <div className="acceso-grid">
        <button className="acceso-card matutino" onClick={() => navigate('/alumno/acceso/aula_virtual')}>
          Aula Virtual
        </button>
        <button className="acceso-card vespertino" onClick={() => navigate('/alumno/acceso/cuestionario')}>
          Cuestionario
        </button>
        <button className="acceso-card mixto" onClick={() => navigate('/alumno/acceso/historial')}>
          Historial
        </button>
        <button className="acceso-card mixto" onClick={() => navigate('/alumno/acceso/simulador')}>
          Simuladores
        </button>
      </div>
    </div>
  );
};

const Principal_Acceso = () => (
  <Routes>
    <Route path="/" element={<AccesoMenu />} />
    <Route path="cuestionario/*" element={<Cuestionario />} />
  </Routes>
);

export default Principal_Acceso;
