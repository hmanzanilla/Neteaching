import React, { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Cuestionario from './cuestionario/Cuestionario';
import AulaVirtual from './aula_virtual/AulaVirtual';
import SeleccionGrupo from './eleccion_grupo/SeleccionGrupo';
import Perfil from './perfil/perfil';
import Videos from './videos/Videos';

import SimuladorMatematicas from './simulador/simuladorMatematicas/simuladorMatematicas';
import SimuladorFisica from './simulador/simuladorFisica/simuladorFisica';
import SimuladorQuimica from './simulador/simuladorQuimica/simuladorQuimica';
import Algebra from './simulador/simuladorMatematicas/Algebra/Algebra'; 
import Probabilidad from './simulador/simuladorMatematicas/Probabilidad/Probabilidad';



import './Principal_Acceso.css';

const AccesoMenu = () => {
  const navigate = useNavigate();
  const [categoriaSimulador, setCategoriaSimulador] = useState('');

  const manejarCambioSimulador = (e) => {
    const categoria = e.target.value;
    setCategoriaSimulador(categoria);

    if (categoria === 'matematicas') {
      navigate('/alumno/acceso/simulador/matematicas');
    } else if (categoria === 'fisica') {
      navigate('/alumno/acceso/simulador/fisica');
    } else if (categoria === 'quimica') {
      navigate('/alumno/acceso/simulador/quimica');
    }
  };

  return (
    <div className="acceso-container">
      <h1 className="acceso-titulo">Bienvenida/o a Neteaching</h1>
      <p className="acceso-descripcion">Selecciona una opción para continuar:</p>

      <div className="acceso-grid">
        <button className="acceso-card" onClick={() => navigate('/alumno/acceso/aula_virtual')}>
          Aula Virtual
        </button>
        <button className="acceso-card" onClick={() => navigate('/alumno/acceso/cuestionario')}>
          Cuestionario
        </button>
        <button className="acceso-card" onClick={() => navigate('/alumno/acceso/historial')}>
          Historial
        </button>

        {/* 🔹 Simuladores con lista desplegable */}
        <select 
          value={categoriaSimulador}
          onChange={manejarCambioSimulador}
          className="acceso-select"
        >
          <option value="">-- Simuladores --</option>
          <option value="matematicas">Matemáticas</option>
          <option value="fisica">Física</option>
          <option value="quimica">Química</option>
        </select>

        <button className="acceso-card" onClick={() => navigate('/alumno/acceso/eleccion_grupo')}>
          Elija su grupo
        </button>
        <button className="acceso-card" onClick={() => navigate('/alumno/acceso/perfil')}>
          Mi Perfil
        </button>
        <button className="acceso-card" onClick={() => navigate('/alumno/acceso/videos')}>
          Videos
        </button>
      </div>
    </div>
  );
};

const Principal_Acceso = () => (
  <Routes>
    <Route path="/" element={<AccesoMenu />} />
    <Route path="cuestionario/*" element={<Cuestionario />} />
    <Route path="aula_virtual/*" element={<AulaVirtual />} />
    <Route path="eleccion_grupo/*" element={<SeleccionGrupo />} />
    <Route path="perfil/*" element={<Perfil />} />
    <Route path="videos/*" element={<Videos />} />
    <Route path="simulador/matematicas/*" element={<SimuladorMatematicas />} />
    <Route path="simulador/fisica/*" element={<SimuladorFisica />} />
    <Route path="simulador/quimica/*" element={<SimuladorQuimica />} />
    <Route path="simulador/simuladorMatematicas/Algebra/*" element={<Algebra />} /> {/* 👈 Aquí añadimos Álgebra */}
    <Route path="simulador/simuladorMatematicas/Probabilidad/*" element={<Probabilidad />} />
  </Routes>
);

export default Principal_Acceso;
