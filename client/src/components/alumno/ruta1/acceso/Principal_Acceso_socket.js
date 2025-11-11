// src/components/alumno/ruta1/acceso/Principal_Acceso.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../../context/UserContext';
import { conectarSocketAlumno } from '../../../../utils/socketAlumno';

import './Principal_Acceso.css';

const Principal_Acceso = () => {
  const { firstName, lastName, isAuthenticated, status, token } = useContext(UserContext);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (status === undefined || isAuthenticated === undefined) return;

    if (!isAuthenticated) {
      console.warn("⛔ No autenticado");
      navigate('/login');
    } else if (status === 'active') {
      console.log("✅ Usuario activo");
      setCargando(false);

      // Conexión con el socket sólo si está activo y hay token
      if (token) {
        const socket = conectarSocketAlumno(token);

        socket.on("connect", () => {
          console.log("🔌 Socket conectado desde Principal_Acceso");
        });

        socket.on("mensaje", (msg) => {
          console.log("📨 Mensaje recibido del servidor:", msg);
        });

        return () => {
          socket.disconnect();
          console.log("❌ Socket desconectado al salir de Principal_Acceso");
        };
      }
    } else {
      console.warn("⚠️ Usuario no activo");
      setCargando(false); // Para mostrar el mensaje en pantalla
    }
  }, [isAuthenticated, status, token, navigate]);

  if (cargando) {
    return (
      <div className="acceso-container">
        <p>Cargando acceso...</p>
      </div>
    );
  }

  if (status !== 'active') {
    return (
      <div className="acceso-container">
        <h2 style={{ color: 'red' }}>Tu cuenta no está activa. Espera la validación del administrador.</h2>
      </div>
    );
  }

  return (
    <div className="acceso-container">
      <h1 className="acceso-titulo">Bienvenida/o, {firstName} {lastName}</h1>
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

export default Principal_Acceso;
