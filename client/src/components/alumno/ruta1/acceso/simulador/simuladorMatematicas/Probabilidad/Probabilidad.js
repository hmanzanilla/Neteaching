// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\acceso\simulador\simuladorMatematicas\Probabilidad\Probabilidad.js
// C:\...\Probabilidad\Probabilidad.js
// client/src/components/alumno/ruta1/acceso/simulador/simuladorMatematicas/Probabilidad/Probabilidad.js

import React, { useState } from 'react';
import './Probabilidad.css';

const Probabilidad = () => {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

  const manejarClickPrincipal = () => {
    setMostrarOpciones(!mostrarOpciones);
  };

  const abrirSimulador = (tipo) => {
    if (tipo === 'union') {
      window.open('/simuladores/Probabilidad/OperacionesConjuntos/Union/uniontresConjuntos.html', '_blank');
    } else if (tipo === 'interseccion') {
      window.open('/simuladores/Probabilidad/OperacionesConjuntos/Interseccion/interseccion.html', '_blank');
    } else if (tipo === 'AIBUC') {
      window.open('/simuladores/Probabilidad/OperacionesConjuntos/(AIB)UC/AIBUC.html', '_blank');
    } else if (tipo === 'diferencia') {
      window.open('/simuladores/Probabilidad/OperacionesConjuntos/Diferencia/diferencia.html', '_blank');
          } else if (tipo === 'AUBIC') {
      window.open('/simuladores/Probabilidad/OperacionesConjuntos/(AUB)IC/AUBIC.html', '_blank');
          } else if (tipo === 'AIB') {
      window.open('/simuladores/Probabilidad/OperacionesConjuntos/AIB/AIB.html', '_blank');     
          } else if (tipo === 'AUB') {
      window.open('/simuladores/Probabilidad/OperacionesConjuntos/AUB/AUB.html', '_blank');       
    }
  };

  return (
    <div className="probabilidad-container">
      <h1 className="probabilidad-titulo">Probabilidad y Estadística</h1>
      <p className="probabilidad-descripcion">Selecciona un simulador:</p>

      <button className="probabilidad-boton" onClick={manejarClickPrincipal}>
        Operaciones con Conjuntos
      </button>

      {mostrarOpciones && (
        <div className="probabilidad-opciones">
          <button
            className="probabilidad-subboton"
            onClick={() => abrirSimulador('union')}
          >
            Unión de tres conjuntos: A ∪ B ∪ C
          </button>
          <button
            className="probabilidad-subboton"
            onClick={() => abrirSimulador('interseccion')}
          >
            Intersección de tres conjuntos: A ∩ B ∩ C
          </button>
          <button
            className="probabilidad-subboton"
            onClick={() => abrirSimulador('AIBUC')}
          >
            Operación : (A ∩ B) U C
          </button>
          <button
            className="probabilidad-subboton"
            onClick={() => abrirSimulador('AUBIC')}
          >
            Operación : (A U B) ∩ C
          </button>       
          <button
            className="probabilidad-subboton"
            onClick={() => abrirSimulador('AIB')}
          >
            Operación : A ∩ B
          </button>  
          <button
            className="probabilidad-subboton"
            onClick={() => abrirSimulador('AIB')}
          >
            Operación : A U B
          </button>                         
          <button
            className="probabilidad-subboton"
            onClick={() => abrirSimulador('diferencia')}
          >
            Diferencia de conjuntos
          </button>
        </div>
      )}
    </div>
  );
};

export default Probabilidad;

