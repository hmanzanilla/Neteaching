// Solo cambia la VISTA. Misma lógica y rutas.
// client/src/components/alumno/ruta1/acceso/Principal_Acceso.js

import React, { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { UserContext } from '../../../../context/UserContext';
import axiosAlumno from '../../../../axiosConfig/axiosAlumno';

// Módulos principales
import AulaVirtual from './aula_virtual/AulaVirtual';
import WhiteboardPro from './aula_virtual/WhiteboardPro'; // 👈 NUEVO (pizarrón en otra vista)
import Cuestionario from './cuestionario/Cuestionario';
import SeleccionGrupo from './eleccion_grupo/SeleccionGrupo';
import Perfil from './perfil/perfil';
import Videos from './videos/Videos';

// Simuladores por áreas (rutas existentes)
import SimuladorMatematicas from './simulador/simuladorMatematicas/simuladorMatematicas';
import SimuladorFisica from './simulador/simuladorFisica/simuladorFisica';
import SimuladorQuimica from './simulador/simuladorQuimica/simuladorQuimica';

// Subcategorías matemáticas (rutas existentes)
import Algebra from './simulador/simuladorMatematicas/Algebra/Algebra';
import Probabilidad from './simulador/simuladorMatematicas/Probabilidad/Probabilidad';

// Estilos
import './Principal_Acceso.css';

const AccesoMenu = () => {
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(UserContext);
  const [fotoUrl, setFotoUrl] = useState(null);

  // 👉 NUEVO: estado de inscripción para dinamizar el tile
  const [miInscripcion, setMiInscripcion] = useState(null); // { status, aula? }

  // Popover de simuladores
  const [menuAbierto, setMenuAbierto] = useState(false);
  const simTileRef = useRef(null);

  // Verificación/token + cargar foto + (NUEVO) leer mi inscripción
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axiosAlumno.get('/auth/verify-token');
        setUserData(res.data);

        if (res.data?._id) {
          // Foto (con cache-buster para evitar que quede pegada)
          try {
            const r = await axiosAlumno.get('/api/perfil/upload/me');
            const base = (axiosAlumno.defaults.baseURL || '').replace(/\/$/, '');
            const abs = r.data?.url
              ? (r.data.url.startsWith('http') ? r.data.url : `${base}${r.data.url}`)
              : null;
            setFotoUrl(abs ? `${abs}?v=${Date.now()}` : null);
          } catch {}

          // 👉 Inscripción actual
          try {
            const ins = await axiosAlumno.get('/api/seleccionarGrupo/mio');
            setMiInscripcion(ins.data || { status: 'none' });
          } catch {
            setMiInscripcion({ status: 'none' });
          }
        }
      } catch (err) {
        console.error('❌ Error al verificar acceso en AccesoMenu:', err);
        navigate('/login');
      }
    };
    cargar();
  }, [navigate, setUserData]);

  // 🔔 Refresca avatar si otra vista avisa que cambió la foto (opcional, no rompe nada)
  useEffect(() => {
    const onUpdated = async () => {
      try {
        if (!userData?._id) return;
        const r = await axiosAlumno.get('/api/perfil/upload/me');
        const base = (axiosAlumno.defaults.baseURL || '').replace(/\/$/, '');
        const abs = r.data?.url
          ? (r.data.url.startsWith('http') ? r.data.url : `${base}${r.data.url}`)
          : null;
        setFotoUrl(abs ? `${abs}?v=${Date.now()}` : null);
      } catch {}
    };
    window.addEventListener('foto-perfil:actualizada', onUpdated);
    return () => window.removeEventListener('foto-perfil:actualizada', onUpdated);
  }, [userData?._id]);

  // Cerrar popover al hacer clic fuera o con Escape
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuAbierto) return;
      if (simTileRef.current && !simTileRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    const onEsc = (e) => { if (e.key === 'Escape') setMenuAbierto(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuAbierto]);

  const nombre =
    [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') ||
    userData?.username ||
    userData?.email ||
    'Alumno';

  const iniciales = (
    (userData?.firstName?.[0] || userData?.username?.[0] || 'A') +
    (userData?.lastName?.[0] || '')
  ).toUpperCase();

  const irASimulador = (categoria) => {
    setMenuAbierto(false);
    if (categoria === 'matematicas') {
      navigate('/alumno/acceso/simulador/matematicas');
    } else if (categoria === 'fisica') {
      navigate('/alumno/acceso/simulador/fisica');
    } else if (categoria === 'quimica') {
      navigate('/alumno/acceso/simulador/quimica');
    }
  };

  // 👉 Texto dinámico y navegación contextual para el tile de grupo
  const yaAsignado = (miInscripcion?.status || '').toLowerCase() === 'confirmed';
  const textoTileGrupo = yaAsignado ? 'Ver mi horario' : 'Elija su grupo';
  const onClickTileGrupo = () => {
    // Pasamos un "hint" para que SeleccionGrupo abra directamente el horario si ya está asignado
    navigate('/alumno/acceso/eleccion_grupo', { state: { verMiHorario: yaAsignado } });
  };

  return (
    <div className="acceso-container">
      <div className="dashboard">
        {/* Header con avatar */}
        <section className="profile-card">
          <div
            className={`avatar ${fotoUrl ? 'con-foto' : 'sin-foto'}`}
            style={fotoUrl ? { backgroundImage: `url(${fotoUrl})` } : {}}
            aria-label="Foto de perfil"
            title="Foto de perfil"
          >
            {!fotoUrl && <span>{iniciales}</span>}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{nombre}</h2>
            <p className="profile-mail">{userData?.email}</p>
          </div>
          <button className="profile-action" onClick={() => navigate('/alumno/acceso/perfil')}>
            Editar foto
          </button>
        </section>

        {/* GRID (orden solicitado) */}
        <section className="grid">
          {/* Fila 1 */}
          <button className="tile" onClick={() => navigate('/alumno/acceso/aula_virtual')}>
            <div className="tile-emoji">🎓</div>
            <div className="tile-title">Aula Virtual</div>
          </button>

          <button className="tile" onClick={() => navigate('/alumno/acceso/cuestionario')}>
            <div className="tile-emoji">📝</div>
            <div className="tile-title">Cuestionario</div>
          </button>

          <button className="tile" onClick={() => navigate('/alumno/acceso/perfil')}>
            <div className="tile-emoji">👤</div>
            <div className="tile-title">Mi Perfil</div>
          </button>

          {/* Fila 2 */}
          <button className="tile" onClick={onClickTileGrupo}>
            <div className="tile-emoji">👥</div>
            <div className="tile-title">{textoTileGrupo}</div>
          </button>

          <button className="tile" onClick={() => navigate('/alumno/acceso/videos')}>
            <div className="tile-emoji">🎬</div>
            <div className="tile-title">Videos</div>
          </button>

          {/* Simuladores con popover */}
          <div className="tile select-tile" ref={simTileRef}>
            <button
              className="tile-as-button"
              aria-haspopup="menu"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((s) => !s)}
            >
              <div className="tile-emoji">🧪</div>
              <div className="tile-title">Simuladores</div>
              <span className={`chevron ${menuAbierto ? 'up' : 'down'}`} aria-hidden>▾</span>
            </button>

            {menuAbierto && (
              <div className="sim-menu" role="menu">
                <button className="sim-item" role="menuitem" onClick={() => irASimulador('matematicas')}>
                  ➗ Matemáticas
                </button>
                <button className="sim-item" role="menuitem" onClick={() => irASimulador('fisica')}>
                  🧲 Física
                </button>
                <button className="sim-item" role="menuitem" onClick={() => irASimulador('quimica')}>
                  ⚗ Química
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const Principal_Acceso = () => (
  <Routes>
    <Route path="/" element={<AccesoMenu />} />

    {/* 🔹 RUTA ESPECÍFICA (antes de la comodín) */}
    <Route path="aula_virtual/pizarra" element={<WhiteboardPro />} />

    {/* 🔹 AULA (comodín) */}
    <Route path="aula_virtual/*" element={<AulaVirtual />} />

    {/* Resto de módulos */}
    <Route path="cuestionario/*" element={<Cuestionario />} />
    <Route path="eleccion_grupo/*" element={<SeleccionGrupo />} />
    <Route path="perfil/*" element={<Perfil />} />
    <Route path="videos/*" element={<Videos />} />

    {/* Simuladores principales */}
    <Route path="simulador/matematicas/*" element={<SimuladorMatematicas />} />
    <Route path="simulador/fisica/*" element={<SimuladorFisica />} />
    <Route path="simulador/quimica/*" element={<SimuladorQuimica />} />

    {/* Subrutas internas Matemáticas */}
    <Route path="simulador/matematicas/algebra/*" element={<Algebra />} />
    <Route path="simulador/matematicas/probabilidad/*" element={<Probabilidad />} />
  </Routes>
);

export default Principal_Acceso;


