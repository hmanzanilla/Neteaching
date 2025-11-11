// src/components/Registro_Principal.js
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Registro_Unificado from './Registro_Unificado';
import Login from './Login';
import Principal_Alumno from './alumno/Principal_Alumno';
import Principal_Maestro from './maestro/Principal_Maestro';
import Principal_Administrador from './administrador/Principal_Administrador';
import Principal_AdminPrincipal from './adminprincipal/Principal_AdminPrincipal';
import Barra from './barra/Barra';
import './Registro_Principal.css';

const Registro_Principal = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Mostrar la barra de navegación solo en la página principal, registro y login
  const showBarra = location.pathname === '/' || location.pathname === '/registro' || location.pathname === '/login';

  useEffect(() => {
    // Redirigir a la página principal después del registro o login exitoso
    if (location.pathname === '/registro-success' || location.pathname === '/login-success') {
      navigate('/');
    }

    // Añadir o quitar la clase 'registro-main-body' del body según la página
    if (location.pathname === '/') {
      document.body.classList.add('registro-main-body');
    } else {
      document.body.classList.remove('registro-main-body');
    }
  }, [location.pathname, navigate]);

  return (
    <div className={location.pathname === '/' ? 'registro-main' : ''}>
      {showBarra && <Barra />}
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={<div> {/* Contenido principal aquí */} </div>} />

        {/* Registro y login */}
        <Route path="registro" element={<Registro_Unificado />} />
        <Route path="login" element={<Login />} />

        {/* Rutas de éxito después del registro y login */}
        <Route path="registro-success" element={<div>Registro completado con éxito. Redirigiendo...</div>} />
        <Route path="login-success" element={<div>Login completado con éxito. Redirigiendo...</div>} />

        {/* Rutas específicas para alumnos, maestros, administradores */}
        <Route path="alumno/*" element={<Principal_Alumno />} />
        <Route path="maestro/*" element={<Principal_Maestro />} />
        <Route path="administrador/*" element={<Principal_Administrador />} />
        <Route path="adminprincipal/*" element={<Principal_AdminPrincipal />} />

        {/* Ruta para manejar redirecciones de 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default Registro_Principal;
