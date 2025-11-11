// client/src/components/adminprincipal/Principal_AdminPrincipal.js
import React, { useEffect, useContext, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import axiosAdmin from '../../axiosConfig/axiosAdmin'; // base del subservidor admin_principal
import { httpAdminPrincipalAuth as axiosAdminAuth } from '../../axiosConfig/http'; // instancia AUTH

import { UserContext } from '../../context/UserContext';

import ControlUsuarios from './ruta4/controlUsuarios/controlUsuarios';
import HorarioGrupos from './ruta4/horarioGrupos/horarioGrupos';
import CargaVideos from './ruta4/videos/cargaVideos';
import BimestreActual from './ruta4/bimestreActual/bimestreActual';

import { io } from 'socket.io-client';
import './Principal_AdminPrincipal.css';

// URL del WebSocket (mismo patrón que en los otros roles)
const WS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) ||
  process.env.REACT_APP_WS_URL ||
  'http://localhost:3000';

const Principal_AdminPrincipal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserData } = useContext(UserContext);
  const [nombreAdmin, setNombreAdmin] = useState('Administrador');

  // refs para WS/heartbeat
  const socketRef = useRef(null);
  const hbRef = useRef(null);

  // Ocultar la botonera cuando entras a subrutas
  const ocultarBotones = [
    '/adminprincipal/control-usuarios',
    '/adminprincipal/horario-grupos',
    '/adminprincipal/cargar-videos',
    '/adminprincipal/bimestre-actual',
  ].some((ruta) => location.pathname.startsWith(ruta));

  useEffect(() => {
    let cancelado = false;

    // handler estable para cierre de pestaña/ventana
    const onUnload = () => {
      try {
        const urlLogout = (axiosAdminAuth?.defaults?.baseURL || '') + '/logout';
        if (navigator.sendBeacon) {
          const blob = new Blob([], { type: 'application/json' });
          navigator.sendBeacon(urlLogout, blob);
        } else {
          fetch(urlLogout, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            keepalive: true,
            body: JSON.stringify({ via: 'beforeunload' }),
          }).catch(() => {});
        }
      } catch {}
      try { socketRef.current?.disconnect(); } catch {}
    };

    (async () => {
      try {
        // 1) Verificar token en el subservidor del admin principal (instancia AUTH)
        const res = await axiosAdminAuth.get('/verify-token', { withCredentials: true });
        if (cancelado) return;

        const payload = res?.data?.user || res?.data || {};
        setUserData(payload);
        setNombreAdmin(payload?.firstName || payload?.name || 'Administrador');

        // 2) Marcar presencia (prefijo + alias fallback)
        try {
          await axiosAdmin.post('/api/admin_principal/marcar-conectado', {}, { withCredentials: true });
        } catch {
          try { await axiosAdmin.post('/marcar-conectado', {}, { withCredentials: true }); } catch {}
        }

        // 3) Conectar WebSocket al servidor PRINCIPAL (cookie httpOnly + rol en auth)
        const s = io(WS_URL, {
          withCredentials: true,
          transports: ['websocket'],
          autoConnect: true,
          auth: { role: 'admin_principal' },
        });
        socketRef.current = s;

        s.on('force-logout', async () => {
          try { await axiosAdminAuth.post('/logout', {}, { withCredentials: true }); } catch {}
          navigate('/login', { replace: true });
        });

        // 4) Heartbeat periódico (alineado con tu GRACE/TTL)
        hbRef.current = setInterval(() => {
          try { s.emit('heartbeat'); } catch {}
        }, 25000);

        // 5) Cierre de pestaña
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('pagehide', onUnload);
      } catch (err) {
        console.error('❌ Verify-token (admin_principal) falló:', err);
        if (!cancelado) navigate('/login', { replace: true });
      }
    })();

    // Limpieza
    return () => {
      cancelado = true;
      try { window.removeEventListener('beforeunload', onUnload); } catch {}
      try { window.removeEventListener('pagehide', onUnload); } catch {}
      if (hbRef.current) clearInterval(hbRef.current);
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, [navigate, setUserData]);

  return (
    <div className={`admin-container ${ocultarBotones ? 'sin-botones' : ''}`}>
      <h1>Panel Principal - Bienvenido {nombreAdmin}</h1>

      {!ocultarBotones && (
        <div className="admin-buttons">
          <button onClick={() => navigate('/adminprincipal/control-usuarios')}>Control de Usuarios</button>
          <button onClick={() => navigate('/adminprincipal/cobro-alumnos')}>Cobro de Alumnos</button>
          <button onClick={() => navigate('/adminprincipal/control-pagos')}>Control de Pagos</button>
          <button onClick={() => navigate('/adminprincipal/control-horario')}>Control de Horario</button>
          <button onClick={() => navigate('/adminprincipal/horario-grupos')}>Horario de Grupos</button>
          <button onClick={() => navigate('/adminprincipal/registro-contable')}>Registro Contable</button>
          <button onClick={() => navigate('/adminprincipal/cargar-videos')}>Cargar Videos</button>
          <button onClick={() => navigate('/adminprincipal/bimestre-actual')}>Bimestre Actual</button>
        </div>
      )}

      <Routes>
        <Route path="control-usuarios" element={<ControlUsuarios />} />
        <Route path="horario-grupos/*" element={<HorarioGrupos />} />
        <Route path="cargar-videos/*" element={<CargaVideos />} />
        <Route path="bimestre-actual" element={<BimestreActual />} />
      </Routes>
    </div>
  );
};

export default Principal_AdminPrincipal;


