// client/src/components/alumno/ruta1/acceso/perfil/SubirFoto.js
import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';
import { UserContext } from '../../../../../context/UserContext';
import axiosAlumno from '../../../../../axiosConfig/axiosAlumno';
import './SubirFoto.css';

const SubirFoto = () => {
  const { userData } = useContext(UserContext);
  const alumnoId = userData?._id;

  const [previewUrl, setPreviewUrl] = useState(null);       // URL local (ObjectURL) para recorte
  const [archivoOriginal, setArchivoOriginal] = useState(null); // File original
  const [mensaje, setMensaje] = useState('');
  const [urlGuardada, setUrlGuardada] = useState(null);     // URL del servidor
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const prevObjectUrlRef = useRef(null);

  const base = (axiosAlumno.defaults.baseURL || process.env.REACT_APP_API_URL_ALUMNOS || 'http://localhost:3001').replace(/\/$/, '');

  const cargarImagenGuardada = useCallback(async () => {
    if (!alumnoId) return;
    try {
      // ⬅️ ahora consultamos /me (usa la cookie para identificar al alumno)
      const { data } = await axiosAlumno.get('/api/perfil/upload/me');
      if (data?.url) {
        const absolute = data.url.startsWith('http') ? data.url : `${base}${data.url}`;
        setUrlGuardada(`${absolute}?v=${Date.now()}`); // cache-buster
      } else {
        setUrlGuardada(null);
      }
    } catch (err) {
      console.error('No hay imagen previa', err?.response?.data || err);
      setUrlGuardada(null);
    }
  }, [alumnoId, base]);

  useEffect(() => { cargarImagenGuardada(); }, [cargarImagenGuardada]);

  // Limpieza del ObjectURL para no filtrar memoria
  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
    };
  }, []);

  const manejarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // libera el anterior si existía
    if (prevObjectUrlRef.current) {
      URL.revokeObjectURL(prevObjectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    prevObjectUrlRef.current = nextUrl;

    setArchivoOriginal(file);
    setPreviewUrl(nextUrl);
    setMensaje('');
  };

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  const subirImagen = async () => {
    if (!previewUrl || !alumnoId || !croppedAreaPixels) {
      setMensaje('⚠ Selecciona y recorta una imagen.');
      return;
    }
    try {
      setSubiendo(true);

      // 👉 Usa el MIME del archivo original si es PNG/JPEG/WEBP; si no, fuerza JPEG
      const outType = /image\/(png|jpeg|webp)/i.test(archivoOriginal?.type || '')
        ? archivoOriginal.type
        : 'image/jpeg';

      // Recorta y exporta con el tipo detectado
      const blob = await getCroppedImg(previewUrl, croppedAreaPixels, outType);

      // Asegura extensión coherente con el tipo de salida
      const ext =
        outType === 'image/png' ? '.png' :
        outType === 'image/webp' ? '.webp' : '.jpg';

      const baseName = (archivoOriginal?.name || 'fotoPerfil').replace(/\.[^.]+$/, '');
      const filename = `${baseName}${ext}`;

      const formData = new FormData();
      formData.append('fotoPerfil', blob, filename);
      // ⛔️ ya no enviamos alumnoId; el backend lo obtiene de la cookie/token

      // ⬅️ usamos axiosAlumno (respeta baseURL, credenciales e interceptores)
      const resp = await axiosAlumno.post('/api/perfil/upload/subir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      if (!resp?.data?.ok) throw new Error('Respuesta inválida del servidor');

      setMensaje('✅ Imagen guardada.');
      setPreviewUrl(null);
      setArchivoOriginal(null);

      // Refresca la URL del servidor (con cache-buster)
      await cargarImagenGuardada();
      // (opcional) notificar a otras vistas
      try { window.dispatchEvent(new Event('foto-perfil:actualizada')); } catch {}
    } catch (err) {
      console.error('Error al subir', err?.message || err);
      setMensaje('❌ Fallo en la subida.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="contenedor-foto-perfil">
      <h3>Mi foto de perfil</h3>

      {urlGuardada && !previewUrl && (
        <img
          src={urlGuardada}
          alt="Foto de perfil"
          width="200"
          height="200"
          className="foto-perfil-img"
        />
      )}

      <input type="file" accept="image/*" onChange={manejarArchivo} />

      {previewUrl && (
        <div className="cropper-container">
          <Cropper
            image={previewUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      {previewUrl && (
        <button className="boton-recortar-foto" onClick={subirImagen} disabled={subiendo}>
          {subiendo ? 'Subiendo…' : 'Guardar Foto Recortada'}
        </button>
      )}

      {mensaje && <p style={{ marginTop: 10 }}>{mensaje}</p>}
    </div>
  );
};

export default SubirFoto;

