// client/src/app.js
import React, { useEffect, useRef, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import Registro_Principal from './components/Registro_Principal';
import NotFound from './components/NotFound';
import { UserContext } from './context/UserContext';

const App = () => {
  const socketRef = useRef(null);
  const { logoutUser, isAuthenticated } = useContext(UserContext);

  useEffect(() => {
    // ✅ Conexión WebSocket SOLO si el usuario está autenticado
    if (!socketRef.current && isAuthenticated) {
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000', {
        withCredentials: true,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Conectado al servidor WebSocket');
      });

      socketRef.current.on('respuesta', (msg) => {
        console.log('📨 Mensaje del servidor:', msg);
      });

      socketRef.current.emit('message', 'Hola desde el cliente');
    }

    // 🔒 Cierre de sesión automático al cerrar la ventana
    const handleBeforeUnload = async (event) => {
      event.preventDefault();
      event.returnValue = '';

      if (isAuthenticated) {
        try {
          await logoutUser();
        } catch (err) {
          console.error('❌ Error al cerrar sesión automáticamente:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Desconectar WebSocket si se desmonta o cambia autenticación
      socketRef.current?.disconnect();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, logoutUser]);

  return (
    <Routes>
      <Route path="/*" element={<Registro_Principal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;