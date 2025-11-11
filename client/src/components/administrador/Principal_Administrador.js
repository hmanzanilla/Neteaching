// client/src/components/administrador/Principal_Administrador.js
import React, { useEffect, useContext, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { UserContext } from '../../context/UserContext';
import './Principal_Administrador.css';

// ✅ Instancias correctas para ADMIN
import axiosAdministrador from '../../axiosConfig/axiosAdministrador';
import { httpAdministradorAuth as axiosAdminAuth } from '../../axiosConfig/http';

// Subrutas del ADMIN (ruta3)
import CrearAula from './ruta3/CrearAula/CrearAula';
import ElegirAula from './ruta3/ElegirAula/ElegirAula';
import Agenda from './ruta3/Agenda/Agenda';

// URL del WebSocket
const WS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) ||
  process.env.REACT_APP_WS_URL ||
  'http://localhost:3000';

// Pequeño componente “hub” para /administrador/ruta3 (muestra sólo la botonera superior)
function HubRuta3() {
  return null; // no renderiza contenido; la botonera vive arriba
}

function Principal_Administrador() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserData } = useContext(UserContext);

  const [nombreAdmin, setNombreAdmin] = useState('Administrador');
  const socketRef = useRef(null);
  const hbRef = useRef(null);

  // Botonera visible sólo **fuera** de las subrutas
  const ocultarBotones = [
    '/administrador/ruta3/crear-aula',
    '/administrador/ruta3/elegir-aula',
    '/administrador/ruta3/agenda',
  ].some((ruta) => location.pathname.startsWith(ruta));

  useEffect(() => {
    let cancelado = false;

    const onUnload = () => {
      try {
        const urlLogout = (axiosAdminAuth?.defaults?.baseURL || '') + '/logout';
        if (navigator.sendBeacon) {
          const blob = new Blob([], { type: 'application/json' });
          navigator.sendBeacon(urlLogout, blob);
        }
      } catch {}
      try { socketRef.current?.disconnect(); } catch {}
    };

    (async () => {
      try {
        // 1) Verificar token en subservidor del ADMIN
        const res = await axiosAdminAuth.get('/verify-token', { withCredentials: true });
        if (cancelado) return;

        const payload = res?.data?.user || res?.data || {};
        setUserData(payload);
        setNombreAdmin(payload?.firstName || payload?.name || 'Administrador');

        // 2) Marcar presencia (no bloquea si falla)
        try { await axiosAdministrador.post('/api/administrador/marcar-conectado'); } catch {}

        // 3) Abrir WebSocket (identificamos el rol para trazas; el backend usa la cookie httpOnly)
        const s = io(WS_URL, {
          withCredentials: true,
          transports: ['websocket'],
          autoConnect: true,
          auth: { role: 'administrador' },
        });
        socketRef.current = s;

        s.on('force-logout', () => {
          try { s.disconnect(); } catch {}
          navigate('/login', { replace: true });
        });

        // 4) Heartbeat simple
        hbRef.current = setInterval(() => {
          try { s.emit('heartbeat'); } catch {}
        }, 25000);

        // 5) Limpiar al cerrar/ocultar
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('pagehide', onUnload);
      } catch {
        if (!cancelado) navigate('/login', { replace: true });
      }
    })();

    return () => {
      cancelado = true;
      try { window.removeEventListener('beforeunload', onUnload); } catch {}
      try { window.removeEventListener('pagehide', onUnload); } catch {}
      if (hbRef.current) clearInterval(hbRef.current);
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, [navigate, setUserData]);

  return (
    <div className={`administrador-container ${ocultarBotones ? 'sin-botones' : ''}`}>
      <h1>Panel del Administrador — Bienvenido {nombreAdmin}</h1>

      {!ocultarBotones && (
        <div className="administrador-buttons">
          <button onClick={() => navigate('ruta3/crear-aula')}>➕ Crear Aula Virtual</button>
          <button onClick={() => navigate('ruta3/elegir-aula')}>🟢 Elegir Aula Virtual</button>
          <button onClick={() => navigate('ruta3/agenda')}>🗓️ Agenda</button>
        </div>
      )}

      <Routes>
        {/* Redirige al hub /administrador/ruta3 */}
        <Route index element={<Navigate to="ruta3" replace />} />
        {/* Hub (evita loops con comodín) */}
        <Route path="ruta3" element={<HubRuta3 />} />
        {/* Subrutas */}
        <Route path="ruta3/crear-aula/*" element={<CrearAula />} />
        <Route path="ruta3/elegir-aula/*" element={<ElegirAula />} />
        <Route path="ruta3/agenda/*" element={<Agenda />} />
        {/* Cualquier ruta inválida vuelve al hub */}
        <Route path="*" element={<Navigate to="ruta3" replace />} />
      </Routes>
    </div>
  );
}

export default Principal_Administrador;

