//horarioGRupos/horarioGrupos.js
import React, { useState } from 'react';
import CreaGrupos from './creaGrupos/creaGrupos';
import VerGrupos from './verGrupos/verGrupos';
import './horarioGrupos.css';

const HorarioGrupos = () => {
  const [vistaActual, setVistaActual] = useState(null); // Estado para definir qué vista mostrar

  // Función para cambiar de vista
  const cambiarVista = (vista) => {
    setVistaActual(vista);
  };

  return (
    <div className="horario-grupos-container">
      {/* 🔹 Mostrar título dinámico según la vista seleccionada */}
      <h1>
        {vistaActual === "creaGrupos"
          ? "Crear un Grupo"
          : vistaActual === "verGrupos"
          ? "Listado de Grupos"
          : "Gestión de Grupos"}
      </h1>

      {/* 🔹 Mostrar los botones solo si no se ha seleccionado ninguna vista */}
      {!vistaActual && (
        <div className="botones-grupos">
          <button onClick={() => cambiarVista("creaGrupos")}>Crear un Grupo</button>
          <button onClick={() => cambiarVista("verGrupos")}>Ver los Grupos</button>
        </div>
      )}

      {/* 🔹 Mostrar el componente correspondiente según la vista seleccionada */}
      {vistaActual === "creaGrupos" && <CreaGrupos />}
      {vistaActual === "verGrupos" && <VerGrupos />}

      {/* 🔹 Botón para regresar a la vista principal */}
      {vistaActual && (
        <button className="back-button" onClick={() => setVistaActual(null)}>
          Volver
        </button>
      )}
    </div>
  );
};

export default HorarioGrupos;
