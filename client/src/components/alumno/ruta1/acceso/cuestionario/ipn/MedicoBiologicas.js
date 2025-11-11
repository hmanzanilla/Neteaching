//cuestionario/ipn/MedicoBiologicas.js
// client/src/components/alumno/ruta1/acceso/cuestionario/ipn/MedicoBiologicas.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Timer from './Timer';

const PUB = process.env.PUBLIC_URL || '';

const MedicoBiologicas = () => {
  const [questions, setQuestions] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [studentName, setStudentName] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // nombre del alumno (si existe en localStorage)
    const name = localStorage.getItem('studentName');
    if (name) setStudentName(name);

    const fetchQuestions = async () => {
      try {
        // El CSV vive en public
        const url = `${PUB}/cuestionarios/ipn/cuestionario1.csv`;
        const res = await fetch(url, { cache: 'no-store' });
        const csv = await res.text();

        // Carga dinámica de PapaParse (evita agregarlo al bundle inicial)
        const Papa = (await import('papaparse')).default;
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

        // Título (primera fila, columna "Pregunta")
        setTitulo(parsed.data?.[0]?.Pregunta || '');

        // Normaliza las filas a nuestro shape
        const questionsData = parsed.data.map((row) => ({
          pregunta: row.Pregunta?.trim() || '',
          a: row.a?.trim() || '',
          b: row.b?.trim() || '',
          c: row.c?.trim() || '',
          d: row.d?.trim() || '',
          respuestaCorrecta: (row.RespuestaCorrecta || '').trim().toLowerCase(), // "a" | "b" | "c" | "d"
          retroalimentacionCorrecta: row.RetroalimentacionCorrecta || '',
          retroalimentacionIncorrecta: row.RetroalimentacionIncorrecta || '',
          carpetaRetroalimentacion: row.CarpetaRetroalimentacion?.trim() || '',
        }));

        setQuestions(questionsData);
      } catch (err) {
        console.error('Error cargando CSV:', err);
        setQuestions([]);
      }
    };

    fetchQuestions();
  }, []);

  const verificarRespuesta = (index, respuestaCorrecta, carpetaRetroalimentacion) => {
    const opcionSeleccionada = document.querySelector(
      `input[name="pregunta${index}"]:checked`
    );
    const retro = document.getElementById(`retroalimentacion${index}`);

    retro.classList.remove('correcto', 'incorrecto');

    if (!opcionSeleccionada) {
      retro.textContent = 'Por favor, selecciona una respuesta.';
      return;
    }

    const elegida = opcionSeleccionada.value.toLowerCase().trim();
    const correcta = (respuestaCorrecta || '').toLowerCase().trim();

    if (elegida === correcta) {
      retro.textContent = questions[index].retroalimentacionCorrecta;
      retro.classList.add('correcto');
    } else {
      retro.textContent = questions[index].retroalimentacionIncorrecta;
      retro.classList.add('incorrecto');

      // 👉 Navega al visor de retroalimentación basado en manifest.json
      //    Ej.: /alumno/acceso/cuestionario/ipn/retro/RF_5
      setTimeout(() => {
        navigate(
          `/alumno/acceso/cuestionario/ipn/retro/${carpetaRetroalimentacion}`,
          { state: { from: location.pathname } }
        );
      }, 1200);
    }
  };

  return (
    <div>
      <h1>Cuestionario: Ciencias Médico Biológicas (IPN)</h1>

      <div
        className="header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}
      >
        <Timer />
        <div
          className="student-name"
          style={{ color: 'blue', fontSize: 24, fontWeight: 'bold' }}
        >
          ¡Bienvenido! {studentName}
        </div>
      </div>

      <div id="titulo" style={{ color: 'red', fontSize: 30, fontWeight: 'bold' }}>
        {titulo}
      </div>

      <div id="cuestionario" style={{ color: 'blue', fontSize: 24 }}>
        {questions.map((dato, index) => {
          // Estructura: "Texto: F_7.jpg"
          const partes = (dato.pregunta || '').split(': ');
          const texto = (partes[0] || '').trim();
          const imagenEnunciado = partes[1] ? partes[1].trim() : null;

          return (
            <div key={index} style={{ marginBottom: 24 }}>
              <h3>
                {index + 1}. {texto}
              </h3>

              {imagenEnunciado && (
                <img
                  src={`${PUB}/cuestionarios/ipn/imagenes/${imagenEnunciado}`}
                  alt="Enunciado"
                  width="900"
                />
              )}

              <div className="fila" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                <label>
                  <input type="radio" name={`pregunta${index}`} value="a" /> {dato.a}
                </label>
                <label>
                  <input type="radio" name={`pregunta${index}`} value="b" /> {dato.b}
                </label>
                <label>
                  <input type="radio" name={`pregunta${index}`} value="c" /> {dato.c}
                </label>
                <label>
                  <input type="radio" name={`pregunta${index}`} value="d" /> {dato.d}
                </label>
              </div>

              <button
                style={{ marginTop: 8 }}
                onClick={() =>
                  verificarRespuesta(
                    index,
                    dato.respuestaCorrecta,
                    dato.carpetaRetroalimentacion
                  )
                }
              >
                Verificar
              </button>
              <p id={`retroalimentacion${index}`}></p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicoBiologicas;


