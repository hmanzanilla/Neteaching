// client/src/components/alumno/ruta1/acceso/simulador/simuladorMatematicas/TrigonometriaGeometria/TrigonometriaGrometria.js

import React, { useState } from 'react';
import './TrigonometriaGeometria.css';

const TrigonometriaGeometria = () => {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

  const manejarClickPrincipal = () => {
    setMostrarOpciones(!mostrarOpciones);
  };

  const abrirSimulador = (tipo) => {
    if (tipo === 'teoremaPitagoras') {
      window.open('/simuladores/TrigonometriaGeometria/teoremaPitagoras/teoremaPitagoras.html', '_blank');
    } else if (tipo === 'funcionesTrigonometricas') {
      window.open('/simuladores/TrigonometriaGeometria/funcionesTrigonometricas/funcionesTrigonometricas.html', '_blank');
    } else if (tipo === 'circuloUnitario') {
      window.open('/simuladores/TrigonometriaGeometria/circuloUnitario/circuloUnitario.html', '_blank');
    } else if (tipo === 'funcionesTrigonometricasInversas') {
      window.open('/simuladores/TrigonometriaGeometria/funcionesTrigonometricasInversas/funcionesTrigonometricasInversas.html', '_blank');
    } 
  };

  return (
    <div className="trigonometriaGeometria-container">
      <h1 className="trigonometriaGeometria-titulo">Trigonometria y Geometria</h1>
      <p className="trigonometriaGeometria-descripcion">Selecciona un simulador:</p>

      <button className="TrigonometriaGeometria-boton" onClick={manejarClickPrincipal}>
        Funciones Trigonométricas
      </button>

      {mostrarOpciones && (
        <div className="trigonometriaGeometria-opciones">
          <button
            className="trigonometriaGeometria-subboton"
            onClick={() => abrirSimulador('teoremaPitagoras')}
          >
            Teorema de Pitágoras
          </button>
          <button
            className="TrigonometriaGeometria-subboton"
            onClick={() => abrirSimulador('funcionesTrigonometricas')}
          >
            Funciones Trigonométricas
          </button>
          <button
            className="TrigonometriaGeometria-subboton"
            onClick={() => abrirSimulador('circuloUnitario')}
          >
            Circulo Unitario
          </button>
          <button
            className="TrigonometriaGeometria-subboton"
            onClick={() => abrirSimulador('funcionesTrigonometricasInversas')}
          >
            Funciones Trigonométricas Inversas
          </button>       
        </div>
      )}
    </div>
  );
};

export default TrigonometriaGeometria;

