// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\acceso\simulador\simuladorMatematicas\simuladorMatematicas.js
// src/components/alumno/ruta1/acceso/simulador/simuladorMatematicas/simuladorMatematicas.js

import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import Algebra from './Algebra/Algebra';
import Probabilidad from './Probabilidad/Probabilidad';
import TrigonometriaGeometria from './TrigonometriaGeometria/TrigonometriaGeometria';
// Puedes agregar más componentes aquí cuando estén listos

import './simuladorMatematicas.css';

const SimuladorMatematicas = () => {
  const navigate = useNavigate();

  const categorias = [
    { nombre: "Álgebra", ruta: "Algebra" },
    { nombre: "Cálculo diferencial e integral", ruta: "Calculo" },
    { nombre: "Geometría Analítica", ruta: "GeometriaAnalitica" },
    { nombre: "Trigonometría y Geometría", ruta: "TrigonometriaGeometria" },
    { nombre: "Pensamiento Matemático", ruta: "Pensamiento" },
    { nombre: "Probabilidad y Estadística", ruta: "Probabilidad" }
  ];

  const manejarClick = (ruta) => {
    navigate(`/alumno/acceso/simulador/matematicas/${ruta}`);
  };

  return (
    <div className="simulador-container">
      <h1 className="simulador-titulo">Simuladores de Matemáticas</h1>
      <p className="simulador-descripcion">Selecciona una categoría para practicar:</p>

      <div className="simulador-grid">
        {categorias.map((categoria, index) => (
          <button
            key={index}
            className="simulador-boton"
            onClick={() => manejarClick(categoria.ruta)}
          >
            {categoria.nombre}
          </button>
        ))}
      </div>

      {/* Rutas internas de las categorías */}
      <Routes>
        <Route path="Algebra/*" element={<Algebra />} />
        <Route path="Probabilidad/*" element={<Probabilidad />} />
        <Route path="TrigonometriaGeometria/*" element={<TrigonometriaGeometria />} />
        {/* Cuando estén listos, agregas:
        <Route path="Calculo/*" element={<Calculo />} />
        <Route path="GeometriaAnalitica/*" element={<GeometriaAnalitica />} />
        <Route path="Pensamiento/*" element={<Pensamiento />} />
        */}
      </Routes>
    </div>
  );
};

export default SimuladorMatematicas;

