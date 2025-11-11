// 📁 src/components/alumno/prueba/acceso_restringido/acceso_restringido.js

import React, { useState, useEffect, useContext } from 'react';
import axiosAlumno from '../../../../../axiosConfig/axiosAlumno';
import { UserContext } from '../../../../../context/UserContext';

const AccesoRestringido = ({ preguntas }) => {
  const { userData } = useContext(UserContext);
  const usuario = userData;

  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(600); // 10 minutos
  const [progresoCargado, setProgresoCargado] = useState(false);
  const [evaluado, setEvaluado] = useState(false);

  useEffect(() => {
    const cargarProgreso = async () => {
      if (!usuario?._id) return;
      try {
        const response = await axiosAlumno.get(`/api/cuestionario/progreso/${usuario._id}`);
        if (response.data.progreso) {
          setRespuestas(response.data.progreso);
        }
      } catch (error) {
        console.error('❌ Error al cargar el progreso:', error);
      } finally {
        setProgresoCargado(true);
      }
    };

    cargarProgreso();

    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          evaluarCuestionario();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [usuario?._id]);

  const manejarCambio = (preguntaId, respuestaSeleccionada) => {
    const nuevasRespuestas = {
      ...respuestas,
      [preguntaId]: respuestaSeleccionada,
    };
    setRespuestas(nuevasRespuestas);

    axiosAlumno
      .post(`/api/cuestionario/guardar/${usuario._id}`, { respuestas: nuevasRespuestas })
      .catch((error) => console.error('❌ Error al guardar el progreso:', error));
  };

  const evaluarCuestionario = () => {
    if (evaluado) return;
    setEvaluado(true);

    let puntuacion = 0;

    preguntas.forEach((pregunta) => {
      const idPregunta = pregunta._id || pregunta.id;
      if (respuestas[idPregunta] === pregunta.respuestaCorrecta) {
        puntuacion++;
      }
    });

    setResultado(`✅ Tu puntuación es ${puntuacion} de ${preguntas.length}`);

    axiosAlumno
      .post(`/api/cuestionario/finalizar/${usuario._id}`, { puntuacion })
      .catch((error) => console.error('❌ Error al guardar la puntuación final:', error));
  };

  const formatTime = (s) => String(s).padStart(2, '0');

  if (!progresoCargado) return <p>⏳ Cargando tu progreso...</p>;

  return (
    <div>
      <h2>Bienvenido, {usuario.nombre}</h2>
      <p>Esta es tu prueba de acceso restringido.</p>
      <p>
        Tiempo restante: {formatTime(Math.floor(tiempoRestante / 60))}:{formatTime(tiempoRestante % 60)}
      </p>

      {preguntas.map((pregunta) => {
        const idPregunta = pregunta._id || pregunta.id;
        const textoPregunta = pregunta.texto || pregunta.pregunta;

        return (
          <div key={idPregunta} style={{ marginBottom: '1rem' }}>
            <p><strong>{textoPregunta}</strong></p>
            {pregunta.opciones.map((opcion, index) => (
              <label key={index} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="radio"
                  name={`pregunta-${idPregunta}`}
                  value={opcion}
                  checked={respuestas[idPregunta] === opcion}
                  onChange={() => manejarCambio(idPregunta, opcion)}
                />
                {opcion}
              </label>
            ))}
          </div>
        );
      })}

      <button onClick={evaluarCuestionario} disabled={evaluado}>
        Enviar
      </button>

      {resultado && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{resultado}</p>}
    </div>
  );
};

export default AccesoRestringido;