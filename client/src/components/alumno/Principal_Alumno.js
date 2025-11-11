// src/components/alumno/Principal_Alumno.js
import React, { useEffect, useContext, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UserContext } from "../../context/UserContext";
import './Principal_Alumno.css';

// Axios del subservidor de alumno
import { httpAlumno as axiosAlumno, httpAlumnoAuth as axiosAlumnoAuth } from '../../axiosConfig/http';

// Submódulos
import Principal_Conocenos from './ruta1/conocenos/Principal_Conocenos';
import Principal_Acceso from './ruta1/acceso/Principal_Acceso';

// WS (sesión única + force-logout)
import { io } from 'socket.io-client';

// URL del WS (segura en Vite/CRA)
const WS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) ||
  process.env.REACT_APP_WS_URL ||
  'http://localhost:3000';

const Principal_Alumno = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, setUserData, loading, setLoading } = useContext(UserContext);
  const [statusConfirmado, setStatusConfirmado] = useState(null);

  // Refs para WS y heartbeat
  const socketRef = useRef(null);
  const hbRef = useRef(null);

  useEffect(() => {
    let cancelado = false;

    // handler estable para beforeunload/pagehide
    const onUnload = () => {
      try {
        const urlLogout = (axiosAlumnoAuth.defaults.baseURL || '') + '/logout';
        if (navigator.sendBeacon) {
          const blob = new Blob([], { type: 'application/json' });
          navigator.sendBeacon(urlLogout, blob);
        }
      } catch {}
      try {
        socketRef.current?.disconnect();
      } catch {}
    };

    const run = async () => {
      try {
        // 1) Verifica token en subservidor alumno
        const res = await axiosAlumnoAuth.get('/verify-token');
        if (cancelado) return;

        setUserData(res.data);
        setStatusConfirmado((res.data?.status || '').toLowerCase().trim());

        // 2) Marca presencia HTTP (no bloquea si falla)
        try {
          await axiosAlumno.post('/api/alumno/marcar-conectado');
        } catch (e) {
          if (e?.response?.status !== 404) {
            console.warn('⚠ No se pudo marcar alumno como conectado:', e?.response?.data?.message || e.message);
          }
        }

        // 3) Conecta WebSocket al servidor principal (cookie httpOnly + rol en auth)
        const s = io(WS_URL, {
          withCredentials: true,
          transports: ['websocket'],
          autoConnect: true,
          auth: { role: 'alumno' },
        });
        socketRef.current = s;

        // Si el servidor detecta otra sesión, esta pestaña se expulsa
        s.on('force-logout', () => {
          try { s.disconnect(); } catch {}
          navigate('/login', { replace: true });
        });

        // 4) Heartbeat periódico
        hbRef.current = setInterval(() => {
          try { s.emit('heartbeat'); } catch {}
        }, 25000);

        // 5) Cierre de pestaña
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('pagehide', onUnload);
      } catch (err) {
        console.error('❌ Token inválido/expirado (alumno):', err);
        if (!cancelado) navigate('/login', { replace: true });
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    run();

    // Limpieza real del effect
    return () => {
      cancelado = true;
      try { window.removeEventListener('beforeunload', onUnload); } catch {}
      try { window.removeEventListener('pagehide', onUnload); } catch {}
      if (hbRef.current) clearInterval(hbRef.current);
      try { socketRef.current?.disconnect(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, setUserData, setLoading]);

  // Navegación según status (tu lógica original)
  useEffect(() => {
    if (!loading && userData) {
      const normalizedStatus = userData.status?.toLowerCase().trim();
      setStatusConfirmado(normalizedStatus);

      if (normalizedStatus === 'active') {
        if (location.pathname === '/alumno' || location.pathname === '/alumno/conocenos') {
          navigate('/alumno/acceso', { replace: true });
        }
      }

      if (normalizedStatus === 'pending') {
        if (location.pathname.startsWith('/alumno/acceso')) {
          navigate('/alumno', { replace: true });
        }
      }
    }
  }, [loading, userData, location.pathname, navigate]);

  // Loader inicial
  if (loading || (!statusConfirmado && !userData?.status)) {
    return (
      <div className="container">
        <div className="main-content">
          <p className="loading">Cargando acceso...</p>
        </div>
      </div>
    );
  }

  const statusFinal = (statusConfirmado || userData?.status || '').toLowerCase().trim();

  return (
    <div className="container">
      <div className="main-content">
        <Routes>
          <Route
            index
            element={
              statusFinal === 'pending' ? (
                <>
                  <h1 style={{ color: "blue" }}>Bienvenidos a Neteaching</h1>
                  <p>
                    ¡Bienvenido a <span style={{ color: "blue", fontWeight: "bold" }}>Neteaching</span>, la plataforma educativa que transforma tu aprendizaje!
                  </p>
                  <p>
                    <span style={{ color: "blue", fontWeight: "bold" }}>Descubre una nueva forma de aprender</span> con Neteaching, donde cada paso que das te acerca más a tus metas.
                    Diseñada para estudiantes como tú, que buscan algo más que una educación tradicional, Neteaching te ofrece herramientas interactivas, simuladores innovadores y
                    cuestionarios personalizados que se adaptan a tu ritmo y estilo de aprendizaje.
                  </p>

                  <h2 style={{ color: "blue" }}>¿Por qué Neteaching?</h2>
                  <ul>
                    <li><span style={{ color: "blue", fontWeight: "bold" }}>Navegación fácil y accesible</span>: Explora nuestras secciones con facilidad gracias a nuestra barra de navegación lateral.</li>
                    <li><span style={{ color: "blue", fontWeight: "bold" }}>Cuestionarios personalizados</span>: Diseñados para tu nivel y área de estudio.</li>
                    <li><span style={{ color: "blue", fontWeight: "bold" }}>Aula virtual interactiva</span>: Participa desde cualquier lugar.</li>
                    <li><span style={{ color: "blue", fontWeight: "bold" }}>Simuladores que hacen la diferencia</span>: Practica con herramientas reales.</li>
                    <li><span style={{ color: "blue", fontWeight: "bold" }}>Tu historial académico al alcance</span>: Siempre sabrás tu avance.</li>
                  </ul>

                  <h2 style={{ color: "blue" }}>¡Empieza hoy!</h2>
                  <p>Con Neteaching, el aprendizaje está en tus manos. No esperes más para descubrir una experiencia educativa que se adapta a ti.</p>
                  <p><span style={{ color: "blue", fontWeight: "bold" }}>¡Únete a Neteaching y lleva tu educación al siguiente nivel!</span></p>
                  <p>¡Tu futuro comienza aquí!</p>

                  <div className="principal-alum-button-container">
                    <a href="/alumno/conocenos" className="principal-alum-button">
                      🔹 Prueba con Neteaching
                    </a>
                  </div>
                </>
              ) : (
                <p style={{ color: "red", fontWeight: "bold" }}>
                  No tienes permiso para ver esta sección. Status recibido: "{userData?.status}"
                </p>
              )
            }
          />
          <Route path="conocenos/*" element={<Principal_Conocenos />} />
          <Route path="acceso/*" element={<Principal_Acceso />} />
          <Route path="*" element={<Navigate to="/alumno" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Principal_Alumno;


