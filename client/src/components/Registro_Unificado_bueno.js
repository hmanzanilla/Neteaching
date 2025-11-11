// src/components/Registro_Unificado.js
/*import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Registro_Unificado.css';

const Registro_Unificado = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    curp: '',
    phoneNumber: '',
    sex: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Referencia para mover el formulario
  const formRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    document.body.classList.add('register-body');
    return () => {
      document.body.classList.remove('register-body');
    };
  }, []);

  // 🔹 Función para obtener la API según el prefijo de la contraseña
  const getApiUrl = () => {
    if (formData.password.startsWith("Maestro_")) {
      return process.env.REACT_APP_API_URL_MAESTROS;
    }
    if (formData.password.startsWith("Administrador_")) {
      return process.env.REACT_APP_API_URL_ADMINISTRADORES;
    }
    return process.env.REACT_APP_API_URL_ALUMNOS;
  };
  

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 🔹 Validación básica del formulario
    if (!formData.email || !formData.password || !formData.username || !formData.firstName || !formData.lastName || !formData.curp || !formData.phoneNumber || !formData.sex) {
      setErrorMessage('Todos los campos son obligatorios.');
      return;
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      setErrorMessage('Error interno: No se pudo determinar la API.');
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/register`, formData);
      setSuccessMessage('Registro exitoso. Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response ? error.response.data.message : 'Error en el registro. Inténtelo de nuevo más tarde.');
    }
  };

  // 🔹 Función para cerrar el formulario
  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      firstName: '',
      lastName: '',
      curp: '',
      phoneNumber: '',
      sex: ''
    });
    setErrorMessage('');
    setSuccessMessage('');
    navigate('/');
  };

  // 🔹 Funciones para permitir mover el formulario
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="register-container"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        position: 'absolute',
      }}
      ref={formRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <form onSubmit={handleSubmit} className="register-form">
        { 🔹 Cabecera movible }
        <div className="drag-handle-register" onMouseDown={handleMouseDown}>
          <h1>Registro de Usuario</h1>
        </div>

        { 🔹 Botón de cerrar }
        <button
          type="button"
          className="close-button-register"
          onClick={handleClose}
        >
          ×
        </button>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        
        <label>Contraseña:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        
        <label>Nombre de usuario:</label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} required />
        
        <label>Nombre(s):</label>
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
        
        <label>Apellidos:</label>
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
        
        <label>CURP:</label>
        <input type="text" name="curp" value={formData.curp} onChange={handleChange} required />
        
        <label>Número de teléfono:</label>
        <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
        
        { 🔹 Campo nuevo para seleccionar el sexo }
        <label>Sexo:</label>
        <select name="sex" value={formData.sex} onChange={handleChange} required>
          <option value="">Selecciona una opción</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>

        <button type="submit">Registrar</button>
      </form>
    </div>
  );
};

export default Registro_Unificado;
*/