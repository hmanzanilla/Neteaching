// 📁 src/components/alumno/conocenos/prueba/cuestionario/Cuestionario.js

import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../../../context/UserContext';
import axiosAlumno from '../../../../../axiosConfig/axiosAlumno';

const Cuestionario = () => {
  const { userData } = useContext(UserContext);
  const usuario = userData;

  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(600); // 10 minutos
  const [progresoCargado, setProgresoCargado] = useState(false);
  const [evaluado, setEvaluado] = useState(false);

  const formatTime = (s) => String(s).padStart(2, '0');

  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario?._id) {
        console.warn('⚠ No hay usuario disponible.');
        return;
      }

      try {
        const preguntasRes = await axiosAlumno.get("/api/cuestionarios");
        setPreguntas(preguntasRes.data);

        const progresoRes = await axiosAlumno.get(`/api/cuestionario/progreso/${usuario._id}`);
        if (progresoRes.data.progreso) {
          setRespuestas(progresoRes.data.progreso);
        }

        setProgresoCargado(true);
      } catch (error) {
        console.error("❌ Error al cargar los datos del cuestionario:", error);
      }
    };

    cargarDatos();

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

  const manejarCambio = (preguntaId, opcionSeleccionada) => {
    const nuevasRespuestas = {
      ...respuestas,
      [preguntaId]: opcionSeleccionada,
    };
    setRespuestas(nuevasRespuestas);

    axiosAlumno
      .post(`/api/cuestionario/guardar/${usuario._id}`, { respuestas: nuevasRespuestas })
      .catch((error) => console.error("❌ Error al guardar progreso:", error));
  };

  const evaluarCuestionario = () => {
    if (evaluado) return;
    setEvaluado(true);

    let puntuacion = 0;
    preguntas.forEach((pregunta) => {
      if (respuestas[pregunta._id] === pregunta.respuestaCorrecta) {
        puntuacion += 1;
      }
    });

    setResultado(`Tu puntuación es ${puntuacion} de ${preguntas.length}`);

    axiosAlumno
      .post(`/api/cuestionario/finalizar/${usuario._id}`, { puntuacion })
      .catch((error) => console.error("❌ Error al guardar puntuación final:", error));
  };

  if (!progresoCargado) return <p>⏳ Cargando tu progreso...</p>;

  return (
    <div>
      <h2>Bienvenido, {usuario.nombre}</h2>
      <p>Esta es tu prueba de acceso restringido.</p>
      <p>
        Tiempo restante: {formatTime(Math.floor(tiempoRestante / 60))}:{formatTime(tiempoRestante % 60)}
      </p>

      {preguntas.map((pregunta) => (
        <div key={pregunta._id}>
          <p>{pregunta.pregunta}</p>
          {pregunta.opciones.map((opcion, index) => (
            <label key={index} style={{ display: "block", marginBottom: "4px" }}>
              <input
                type="radio"
                name={`pregunta-${pregunta._id}`}
                value={opcion}
                checked={respuestas[pregunta._id] === opcion}
                onChange={() => manejarCambio(pregunta._id, opcion)}
              />
              {opcion}
            </label>
          ))}
        </div>
      ))}

      <button onClick={evaluarCuestionario} disabled={evaluado}>
        Enviar
      </button>

      {resultado && <p>{resultado}</p>}
    </div>
  );
};

export default Cuestionario;