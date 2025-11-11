// Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registro_Principal.css';
import backgroundImage from '../imagenes/F_logo.jpg'; // Asegúrate de que esta ruta sea correcta

const Home = () => {
  const navigate = useNavigate();
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showRegisterOptions, setShowRegisterOptions] = useState(false);

  const toggleLoginOptions = () => {
    setShowLoginOptions(!showLoginOptions);
    setShowRegisterOptions(false);
  };

  const toggleRegisterOptions = () => {
    setShowRegisterOptions(!showRegisterOptions);
    setShowLoginOptions(false);
  };

  return (
    <div className="registro-main" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <h1>Registro de Usuario</h1>
      <div className="registro-links">
        <button onClick={toggleLoginOptions}>Iniciar Sesión</button>
        {showLoginOptions && (
          <div className="login-options">
            <button onClick={() => navigate('/login/alumno')}>Alumno</button>
            <button onClick={() => navigate('/login/maestro')}>Maestro</button>
            <button onClick={() => navigate('/login/administrador')}>Administrador</button>
          </div>
        )}
        <button onClick={toggleRegisterOptions}>Crear Nuevo Usuario</button>
        {showRegisterOptions && (
          <div className="register-options">
            <button onClick={() => navigate('/registro-alumno')}>Alumno</button>
            <button onClick={() => navigate('/registro-maestro')}>Maestro</button>
            <button onClick={() => navigate('/registro-administrador')}>Administrador</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
