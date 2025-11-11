// src/components/maestro/Principal_Maestro.js
// src/components/maestro/Principal_Maestro.js
import React, { useEffect, useContext, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { UserContext } from '../../context/UserContext';
import './Principal_Maestro.css';

// Axios desde http.js
import {
  httpMaestro as axiosMaestro,
  httpMaestroAuth as axiosMaestroAuth,
} from '../../axiosConfig/http';

// Subrutas (las que ya existen)
import CrearAula from './ruta2/CrearAula/CrearAula';
import ElegirAula from './ruta2/ElegirAula/ElegirAula';
import Agenda from './ruta2/Agenda/Agenda';

// URL del WebSocket
const WS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) ||
  process.env.REACT_APP_WS_URL ||
  'http://localhost:3000';

function Principal_Maestro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserData } = useContext(UserContext);

  const [nombreMaestro, setNombreMaestro] = useState('Profesor');
  const socketRef = useRef(null);
  const hbRef = useRef(null);

  // Ocultar tarjetas cuando no estamos en el hub (/maestro/ruta2)
  const ocultarBotones = [
    '/maestro/ruta2/crear-aula',
    '/maestro/ruta2/elegir-aula',
    '/maestro/ruta2/agenda',
    '/maestro/ruta2/mis-postulaciones',
    '/maestro/ruta2/grupos',
    '/maestro/ruta2/portafolios',
    '/maestro/ruta2/listas',
    '/maestro/ruta2/desempeno',
    '/maestro/ruta2/entrar-clase',
    '/maestro/ruta2/materiales',
    '/maestro/ruta2/perfil',
  ].some((ruta) => location.pathname.startsWith(ruta));

  useEffect(() => {
    let cancelado = false;

    const onUnload = () => {
      try {
        const urlLogout = (axiosMaestroAuth.defaults.baseURL || '') + '/logout';
        if (navigator.sendBeacon) {
          const blob = new Blob([], { type: 'application/json' });
          navigator.sendBeacon(urlLogout, blob);
        }
      } catch {}
      try { socketRef.current?.disconnect(); } catch {}
    };

    (async () => {
      try {
        // 1) Verificar token en subservidor de maestro
        const res = await axiosMaestroAuth.get('/verify-token');
        if (cancelado) return;

        setUserData(res.data);
        setNombreMaestro(res.data?.firstName || res.data?.name || 'Profesor');

        // 2) Marcar presencia (no bloquea si falla)
        try { await axiosMaestro.post('/api/maestro/marcar-conectado'); } catch {}

        // 3) WebSocket al servidor principal (incluye rol en auth)
        const s = io(WS_URL, {
          withCredentials: true,
          transports: ['websocket'],
          autoConnect: true,
          auth: { role: 'maestro' },
        });
        socketRef.current = s;

        s.on('force-logout', () => {
          try { s.disconnect(); } catch {}
          navigate('/login', { replace: true });
        });

        // 4) Heartbeat
        hbRef.current = setInterval(() => {
          try { s.emit('heartbeat'); } catch {}
        }, 25000);

        // 5) Cierre de pestaña
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
    <div className={`maestro-container ${ocultarBotones ? 'sin-botones' : ''}`}>
      {/* Encabezado con avatar (estilo alumno) */}
      <div className="maestro-hero">
        <img className="maestro-avatar" src="/foto_perfil_maestro.jpg" alt="Foto del Maestro" />
        <div className="maestro-hero-info">
          <h1>Panel del Maestro - Bienvenido {nombreMaestro}</h1>
          <p className="maestro-tagline">En Neteaching pensamos en tu futuro</p>
        </div>
        <button className="btn-outline" onClick={() => navigate('ruta2/perfil')}>Editar foto</button>
      </div>

      {/* === GRID de azulejos (cada tarjeta es el botón) === */}
      {!ocultarBotones && (
        <div className="maestro-grid">
          <Link to="ruta2/mis-postulaciones" className="tile" role="button" aria-label="Horarios Rígidos">
            <div className="tile-icon">📅</div>
            <div className="tile-title">Horarios Rígidos</div>
            <p className="tile-desc">Postúlate a las materias de los horarios establecidos</p>
          </Link>

          <Link to="ruta2/elegir-aula" className="tile" role="button" aria-label="Aulas Virtuales">
            <div className="tile-icon">🎓</div>
            <div className="tile-title">Aulas Virtuales</div>
            <p className="tile-desc">Crea o elige aulas según tu asignación</p>
          </Link>

          <Link to="ruta2/grupos" className="tile" role="button" aria-label="Grupos Asignados">
            <div className="tile-icon">👥</div>
            <div className="tile-title">Grupos Asignados</div>
            <p className="tile-desc">Accede a tus grupos, listas y evidencias</p>
          </Link>

          <Link to="ruta2/entrar-clase" className="tile" role="button" aria-label="Entrar a Clase">
            <div className="tile-icon">🟦</div>
            <div className="tile-title">Entrar a Clase</div>
            <p className="tile-desc">Accede al aula virtual según tu horario</p>
          </Link>

          <Link to="ruta2/materiales" className="tile" role="button" aria-label="Material Didáctico">
            <div className="tile-icon">📚</div>
            <div className="tile-title">Material Didáctico</div>
            <p className="tile-desc">Sube o gestiona recursos para tus clases</p>
          </Link>

          <Link to="ruta2/perfil" className="tile" role="button" aria-label="Perfil Académico">
            <div className="tile-icon">🧑‍🏫</div>
            <div className="tile-title">Perfil Académico</div>
            <p className="tile-desc">Actualiza tu formación y experiencia</p>
          </Link>
        </div>
      )}

      {/* === Rutas === */}
      <Routes>
        {/* Hub */}
        <Route index element={<Navigate to="ruta2" replace />} />
        {/* Rutas existentes */}
        <Route path="ruta2/crear-aula/*" element={<CrearAula />} />
        <Route path="ruta2/elegir-aula/*" element={<ElegirAula />} />
        <Route path="ruta2/agenda/*" element={<Agenda />} />
        {/* Placeholders navegables para cablear luego */}
        <Route path="ruta2/mis-postulaciones" element={<div className="placeholder">Mis Postulaciones (pendiente de cablear)</div>} />
        <Route path="ruta2/grupos" element={<div className="placeholder">Listado de Grupos (pendiente)</div>} />
        <Route path="ruta2/portafolios" element={<div className="placeholder">Portafolios (pendiente)</div>} />
        <Route path="ruta2/listas" element={<div className="placeholder">Listas de Alumnos (pendiente)</div>} />
        <Route path="ruta2/desempeno" element={<div className="placeholder">Desempeño (pendiente)</div>} />
        <Route path="ruta2/entrar-clase" element={<div className="placeholder">Enlace al Aula (pendiente)</div>} />
        <Route path="ruta2/materiales" element={<div className="placeholder">Materiales (pendiente)</div>} />
        <Route path="ruta2/perfil" element={<div className="placeholder">Perfil Académico (pendiente)</div>} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="ruta2" replace />} />
      </Routes>
    </div>
  );
}

export default Principal_Maestro;





