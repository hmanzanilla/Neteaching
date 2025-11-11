// client\src\components\alumno\ruta1\acceso\videos\Videos.js
import React, { useState } from 'react';
import api from '../../../../../utils/axiosInstance';


const categorias = [
  "Biología",
  "Física",
  "Matemáticas",
  "Química",
  "Historia",
  "Competencia Escrita",
  "Competencia Lectora",
  "Reading Comprehension"
];

const Videos = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [videos, setVideos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const manejarCambioCategoria = async (e) => {
    const categoria = e.target.value;
    setCategoriaSeleccionada(categoria);
    setCargando(true);

    try {
      const response = await api.get(`/api/videosAlumno?categoria=${encodeURIComponent(categoria)}`);
      setVideos(response.data);
    } catch (error) {
      console.error("❌ Error al cargar videos:", error.message);
      alert("Error al cargar videos. Intenta más tarde.");
    } finally {
      setCargando(false);
    }
  };

  const abrirVideo = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
      <h2>Videos Educativos</h2>

      <label htmlFor="categoria">Selecciona una categoría:</label><br />
      <select
        id="categoria"
        value={categoriaSeleccionada}
        onChange={manejarCambioCategoria}
        style={{ width: '100%', padding: '10px', margin: '20px 0' }}
      >
        <option value="">-- Elige una categoría --</option>
        {categorias.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {cargando && <p>Cargando videos...</p>}

      {videos.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Videos disponibles:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {videos.map((video) => (
              <li key={video._id} style={{ margin: '10px 0' }}>
                <button
                  onClick={() => abrirVideo(video.url)}
                  style={{
                    backgroundColor: '#061ef9',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  {video.nombreVideo || video.url}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!cargando && categoriaSeleccionada && videos.length === 0 && (
        <p>🚫 No hay videos disponibles en esta categoría.</p>
      )}
    </div>
  );
};

export default Videos;