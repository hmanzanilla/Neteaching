//simulador/simuladorMatematicas/simuladorMatematicas.js
// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\acceso\simulador\simuladorMatematicas\simuladorMatematicas.js
// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\acceso\simulador\simuladorMatematicas\simuladorMatematicas.js
import React from 'react';
import './simuladorMatematicas.css'; // 👈 Importamos el CSS especial

const SimuladorMatematicas = () => {
  const categorias = [
    "Álgebra",
    "Cálculo diferencial e integral",
    "Geometría Analítica",
    "Geometría y Trigonometría",
    "Pensamiento Matemático",
    "Probabilidad y Estadística"
  ];

  return (
    <div className="simulador-container">
      <h1 className="simulador-titulo">Simuladores de Matemáticas</h1>
      <p className="simulador-descripcion">Selecciona una categoría para practicar:</p>

      <div className="simulador-grid">
        {categorias.map((categoria, index) => (
          <button
            key={index}
            className="simulador-boton"
            onClick={() => alert(`Seleccionaste: ${categoria}`)}
          >
            {categoria}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimuladorMatematicas;
