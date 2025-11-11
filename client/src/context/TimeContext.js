// src/TimeContext.js
import React, { createContext, useState, useEffect } from 'react';

// Crear el contexto
export const TimeContext = createContext();

// Crear el proveedor del contexto
export const TimeProvider = ({ children }) => {
  // Estado para almacenar la hora actual
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estado para almacenar el inicio de la sesión
  const [sessionStart, setSessionStart] = useState(() => {
    const storedSessionStart = localStorage.getItem('sessionStart');
    return storedSessionStart ? new Date(storedSessionStart) : new Date();
  });

  // Estado para almacenar la duración de la sesión en minutos
  const [sessionDuration, setSessionDuration] = useState(0);

  // Actualiza la hora actual cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Actualiza cada segundo

    return () => clearInterval(timer); // Limpia el intervalo al desmontar
  }, []);

  // Guarda sessionStart en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('sessionStart', sessionStart.toISOString());
  }, [sessionStart]);

  // Actualiza la duración de la sesión cada minuto
  useEffect(() => {
    const updateSessionDuration = () => {
      const now = new Date();
      const duration = Math.floor((now - sessionStart) / 1000 / 60); // En minutos
      setSessionDuration(duration);
    };

    // Actualiza inmediatamente al montar
    updateSessionDuration();

    // Configura el intervalo para actualizar cada minuto
    const durationInterval = setInterval(updateSessionDuration, 60000);

    return () => clearInterval(durationInterval); // Limpia el intervalo al desmontar
  }, [sessionStart]);

  // Función para reiniciar la sesión (por ejemplo, al cerrar sesión)
  const resetSession = () => {
    const newSessionStart = new Date();
    setSessionStart(newSessionStart);
    setSessionDuration(0);
    localStorage.setItem('sessionStart', newSessionStart.toISOString());
  };

  return (
    <TimeContext.Provider value={{ currentTime, sessionStart, sessionDuration, resetSession }}>
      {children}
    </TimeContext.Provider>
  );
};
