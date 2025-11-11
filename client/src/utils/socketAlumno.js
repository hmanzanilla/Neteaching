// src/utils/socketAlumno.js
import { io } from "socket.io-client";

let socket;

export const conectarSocketAlumno = (token) => {
  if (!socket) {
    const url = process.env.REACT_APP_SOCKET_URL;

    if (!url) {
      console.error("❌ FALTA definir REACT_APP_SOCKET_URL en el entorno");
      return null;
    }

    socket = io(url, {
      auth: { token }
    });
  }
  return socket;
};

export const obtenerSocketAlumno = () => socket;