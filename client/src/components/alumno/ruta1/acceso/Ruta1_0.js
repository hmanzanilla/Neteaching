//Ruta1.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Ruta1.css';
import backgroundImage from './Cuestionario.jpg';

const Ruta1 = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // Simular la obtención del nombre del alumno desde la base de datos
    const fetchStudentName = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const response = await axios.get(`${apiUrl}/api/auth/student`);
        setStudentName(response.data.firstName + ' ' + response.data.lastName);
      } catch (error) {
        console.error('Error al obtener el nombre del alumno:', error);
      }
    };

    fetchStudentName();

    return () => clearInterval(interval);
  }, []);

  const handleQuizClick = (institution, examType) => {
    navigate(`/cuestionario/${institution}/${examType}`);
  };

  const handleVirtualClassClick = () => {
    navigate('/clase-virtual');
  };

  return (
    <div className="ruta1-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="header">
        <div className="datetime">{dateTime.toLocaleString()}</div>
        <div className="welcome-message">¡Bienvenido! {studentName}</div>
      </div>
      <div className="buttons">
        <button onClick={() => handleQuizClick('ipn', 'medico-biologicas')}>IPN: Ciencias Médico Biológicas</button>
        <button onClick={() => handleQuizClick('ipn', 'sociales-administrativas')}>IPN: Ciencias Sociales y Administrativas</button>
        <button onClick={() => handleQuizClick('ipn', 'ingenieria')}>IPN: Ingeniería Ciencias Físico Matemáticas</button>

        <button onClick={() => handleQuizClick('unam', 'medico-biologicas')}>UNAM: Ciencias Médico Biológicas</button>
        <button onClick={() => handleQuizClick('unam', 'sociales-administrativas')}>UNAM: Ciencias Sociales y Administrativas</button>
        <button onClick={() => handleQuizClick('unam', 'ingenieria')}>UNAM: Ingeniería Ciencias Físico Matemáticas</button>

        <button onClick={() => handleQuizClick('uam', 'medico-biologicas')}>UAM: Ciencias Médico Biológicas</button>
        <button onClick={() => handleQuizClick('uam', 'sociales-administrativas')}>UAM: Ciencias Sociales y Administrativas</button>
        <button onClick={() => handleQuizClick('uam', 'ingenieria')}>UAM: Ingeniería Ciencias Físico Matemáticas</button>

        <button onClick={handleVirtualClassClick}>Comenzar Clase Virtual</button>
      </div>
    </div>
  );
};

export default Ruta1;
