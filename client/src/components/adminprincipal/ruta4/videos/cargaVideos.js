//client\src\components\adminprincipal\ruta4\videos\cargaVideos.js
import React, { useState } from 'react';
import axiosAdmin from '../../../../axiosConfig/axiosAdmin'; // Asegúrate que la ruta sea correcta

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
  const [videoUrl, setVideoUrl] = useState('');
  const [categoria, setCategoria] = useState('');
  const [guardado, setGuardado] = useState('');

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!videoUrl.trim() || !categoria) {
      alert('⚠ Por favor ingresa una URL válida y selecciona una categoría.');
      return;
    }

    try {
      const response = await axiosAdmin.post('/api/cargaVideos', {
        url: videoUrl,
        categoria
      });

      setGuardado(videoUrl);
      setVideoUrl('');
      setCategoria('');
      alert("✅ Video guardado correctamente.");
    } catch (err) {
      if (err.response) {
        alert("❌ Error al guardar el video: " + err.response.data.message);
      } else {
        alert("❌ Error de red: " + err.message);
      }
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
      <h2>Gestor de Videos Educativos</h2>
      <form onSubmit={manejarEnvio}>
        <label htmlFor="categoria">Selecciona la categoría:</label><br />
        <select
          id="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        >
          <option value="">-- Elige una categoría --</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label htmlFor="url">Pega aquí la URL del video:</label><br />
        <input
          type="url"
          id="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{ width: '100%', padding: '10px', margin: '15px 0' }}
          required
        />

        <button type="submit" style={{
          backgroundColor: '#061ef9',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Guardar
        </button>
      </form>

      {guardado && (
        <div style={{ marginTop: '30px' }}>
          <h3>Video ingresado:</h3>
          <p>{guardado}</p>
          {(guardado.includes('youtube.com') || guardado.includes('youtu.be')) ? (
            <div style={{ marginTop: '15px' }}>
              <iframe
                width="100%"
                height="315"
                src={transformarYouTubeUrl(guardado)}
                title="Video"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <p>🔗 Video no embebido. Solo se mostró la URL ingresada.</p>
          )}
        </div>
      )}
    </div>
  );
};

// 🧠 Transforma una URL de YouTube en una URL embebida
const transformarYouTubeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes('youtu.be/')) {
      const parts = url.split('/');
      return `https://www.youtube.com/embed/${parts[parts.length - 1]}`;
    }

    return '';
  } catch (error) {
    return '';
  }
};

export default Videos;