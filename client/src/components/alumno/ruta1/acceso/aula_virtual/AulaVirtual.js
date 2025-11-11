// 📁 C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_OC_1\client\src\components\alumno\ruta1\acceso\aula_virtual\AulaVirtual.js
// client/src/components/alumno/ruta1/acceso/aula_virtual/AulaVirtual.js
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import JitsiMeet from "./JitsiMeet";
import "./AulaVirtual.css";

const AulaVirtual = () => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [ready, setReady] = useState(false);

  const toggleFullscreen = () => {
    const el = cardRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };

  const abrirPizarra = () => {
    // Lleva al pizarrón PRO en una vista dedicada dentro de la SPA
    navigate("/alumno/acceso/aula_virtual/pizarra");
    // Si lo prefieres en nueva pestaña:
    // window.open("/alumno/acceso/aula_virtual/pizarra", "_blank", "noopener");
  };

  return (
    <div className="av-wrap">
      <div className="av-card" ref={cardRef}>
        <header className="av-header">
          <div className="av-title">
            <span className="av-dot" aria-hidden="true"></span>
            <span>Aula Neteaching</span>
          </div>
          <span className={`av-badge ${ready ? "ok" : ""}`}>
            {ready ? "Conectado" : "Cargando…"}
          </span>
        </header>

        <div className="av-stage">
          {/* El embed ocupa todo el escenario */}
          <JitsiMeet
            roomName="AulaNeteaching"
            displayName="Usuario Neteaching"
            onReady={() => setReady(true)}
          />
        </div>

        <div className="av-controls">
          <button className="av-btn" onClick={toggleFullscreen}>⛶ Pantalla completa</button>
          <button className="av-btn" onClick={abrirPizarra}>🧑‍🏫 Abrir Pizarrón</button>
          <button className="av-btn danger" onClick={() => navigate("/alumno/acceso")}>⎋ Salir del Aula</button>
        </div>
      </div>
    </div>
  );
};

export default AulaVirtual;

