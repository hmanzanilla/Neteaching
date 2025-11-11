// client/src/components/alumno/ruta1/acceso/cuestionario/MenuCuestionarios.js
// client/src/components/alumno/ruta1/acceso/cuestionario/MenuCuestionarios.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Cuestionario.css";

export default function MenuCuestionarios() {
  const navigate = useNavigate();

  return (
    <div className="cuestionario-container">
      <div className="header">
        <h1 style={{ margin: 0 }}>Cuestionarios</h1>
      </div>

      <div className="university-buttons">
        {/* IPN */}
        <button onClick={() => navigate("ipn/medico-biologicas")}>
          IPN: Ciencias Médico Biológicas
        </button>
        <button onClick={() => navigate("ipn/sociales-administrativas")}>
          IPN: Ciencias Sociales y Administrativas
        </button>
        <button onClick={() => navigate("ipn/ingenieria")}>
          IPN: Ingeniería Ciencias Físico Matemáticas
        </button>

        {/* UNAM */}
        <button onClick={() => navigate("unam/medico-biologicas")}>
          UNAM: Ciencias Médico Biológicas
        </button>
        <button onClick={() => navigate("unam/sociales-administrativas")}>
          UNAM: Ciencias Sociales y Administrativas
        </button>
        <button onClick={() => navigate("unam/ingenieria")}>
          UNAM: Ingeniería Ciencias Físico Matemáticas
        </button>

        {/* UAM */}
        <button onClick={() => navigate("uam/medico-biologicas")}>
          UAM: Ciencias Médico Biológicas
        </button>
        <button onClick={() => navigate("uam/sociales-administrativas")}>
          UAM: Ciencias Sociales y Administrativas
        </button>
        <button onClick={() => navigate("uam/ingenieria")}>
          UAM: Ingeniería Ciencias Físico Matemáticas
        </button>
      </div>
    </div>
  );
}

