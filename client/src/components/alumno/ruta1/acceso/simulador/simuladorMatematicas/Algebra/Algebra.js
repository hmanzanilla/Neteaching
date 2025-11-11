// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\acceso\simulador\simuladorMatematicas\Algebra\Algebra.js
// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\acceso\simulador\simuladorMatematicas\Algebra\Algebra.js
import React, { useState } from 'react';
import './Algebra.css';

const Algebra = () => {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

  const manejarClickPrincipal = () => {
    setMostrarOpciones(!mostrarOpciones);
  };

  const abrirSimulador = (tipo) => {
    if (tipo === 'sumadosFracciones') {
      window.open('/simuladores/Algebra/sumadosFracciones/sumadosFracciones.html', '_blank');
    }else if (tipo === 'parabola') {
      window.open('/simuladores/Algebra/parabola/parabola.html', '_blank');
    }else if (tipo === 'sumas/restas'){
      window.open('/simuladores/Algebra/suma_resta/suma_resta_enteros.html', '_blank');
    }
    // Aquí puedes agregar más condiciones si implementas más simuladores.
  };

  return (
    <div className="algebra-container">
      <h1 className="algebra-titulo">Álgebra</h1>
      <p className="algebra-descripcion">Selecciona un simulador:</p>

      <button className="algebra-boton" onClick={manejarClickPrincipal}>
        Operaciones Básicas
      </button>

      {mostrarOpciones && (
        <div className="algebra-opciones">
          <button className="algebra-subboton" onClick={() => abrirSimulador('sumadosFracciones')}>
            Suma de dos fracciones
          </button>
          <button className="algebra-subboton" onClick={() => abrirSimulador('parabola')}>
            Operaciones con parábola
          </button>
          <button className="algebra-subboton" onClick={() => abrirSimulador('sumas/restas')}>
            sumas y restas de enteros
          </button>
        </div>
      )}
    </div>
  );
};

export default Algebra;