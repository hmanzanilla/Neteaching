// client\src\components\alumno\ruta1\conocenos\Principal_Conocenos.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../../../context/UserContext';
import Suscribete from './suscribete/Suscribete';
import { conectarSocketAlumno } from '../../../../utils/socketAlumno'; // 🆕 Socket importado
import './Principal_Conocenos.css';

const Principal_Conocenos = () => {
  const navigate = useNavigate();
  const {
    userData,
    isAuthenticated,
    getApiUrl,
    setHaRealizadoPrueba,
    loading,
  } = useContext(UserContext);

  const [error, setError] = useState('');
  const [haRealizadoPrueba, setLocalHaRealizadoPrueba] = useState(false);

  const firstName = userData?.firstName || 'Usuario';
  const userId = userData?.userId;
  const role = userData?.role;
  const token = userData?.token;

  // 🧠 Verificar estado de la prueba con axios
  useEffect(() => {
    if (!isAuthenticated) {
      console.warn('⚠ Usuario no autenticado, redirigiendo a /login...');
      navigate('/login');
      return;
    }

    if (!userId || !role || !getApiUrl || !token) {
      console.error('❌ Error: Datos insuficientes (userId, role, getApiUrl o token)');
      setError('Error al obtener la información del usuario.');
      return;
    }

    const apiUrl = getApiUrl(role);

    if (!apiUrl) {
      console.error('❌ Error: No se pudo determinar la API para el rol:', role);
      setError('Error en la configuración del servidor.');
      return;
    }

    const fetchEstadoPrueba = async () => {
      try {
        console.log('📡 Verificando si el usuario ha realizado la prueba...');
        const response = await axios.get(`${apiUrl}/api/pruebas/estado/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ Estado de prueba recibido:', response.data);
        setHaRealizadoPrueba(response.data.haRealizadoPrueba);
        setLocalHaRealizadoPrueba(response.data.haRealizadoPrueba);
      } catch (err) {
        if (err.response?.status === 404) {
          console.warn("⚠ No hay registro de prueba. Se asume que no ha sido realizada.");
          setHaRealizadoPrueba(false);
          setLocalHaRealizadoPrueba(false);
        } else {
          console.error('❌ Error al obtener el estado de la prueba:', err);
          setError('No se pudo cargar la información de la prueba.');
        }
      }
    };

    fetchEstadoPrueba();
  }, [isAuthenticated, userId, role, getApiUrl, token, navigate, setHaRealizadoPrueba]);

  // 🧲 CONECTAR SOCKET PARA ESCUCHAR CAMBIO DE ESTADO
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = conectarSocketAlumno(token);

    socket.on("connect", () => {
      console.log("🔌 Socket conectado desde Principal_Conocenos");
    });

    socket.on("estado_actualizado", (nuevoEstado) => {
      console.log("📨 Estado actualizado vía socket:", nuevoEstado);
      if (nuevoEstado === "active") {
        alert("✅ ¡Tu cuenta ha sido activada por el administrador!");
        navigate("/alumno/acceso");
      }
    });

    return () => {
      socket.disconnect();
      console.log("❌ Socket desconectado desde Principal_Conocenos");
    };
  }, [isAuthenticated, token, navigate]);

  const handleNavigate = (path) => {
    console.log(`🔄 Navegando a ${path}`);
    navigate(path);
  };

  const handleSalir = () => {
    console.debug('🔙 Botón "Salir" presionado. Navegando hacia atrás...');
    navigate(-1);
  };

  if (loading) {
    console.log('⏳ Mostrando spinner de carga...');
    return <div className="loading-spinner">Cargando...</div>;
  }

  return (
    <section className="principal-conocenos">
      <h1>Bienvenido {firstName} a Neteaching</h1>
      <article>
        <p>Neteaching es una plataforma educativa innovadora que te ofrece las mejores herramientas para tu aprendizaje.</p>
        <p>Con Neteaching, podrás acceder a materiales didácticos, simuladores y más, todo adaptado a tus necesidades.</p>
      </article>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="botones">
        {!haRealizadoPrueba ? (
          <button onClick={() => handleNavigate('/alumno/prueba')}>Realizar Prueba</button>
        ) : (
          <p>✅ Ya has realizado la prueba. Ahora puedes suscribirte para acceder al contenido completo.</p>
        )}

        <button onClick={() => handleNavigate('/alumno/suscribete')}>Suscribirse a Neteaching</button>
        <button onClick={handleSalir}>Salir</button>
      </div>

      <Routes>
        <Route path="/alumno/suscribete" element={<Suscribete />} />
      </Routes>
    </section>
  );
};

export default Principal_Conocenos;

