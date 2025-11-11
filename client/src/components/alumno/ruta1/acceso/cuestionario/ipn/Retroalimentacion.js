// client/src/components/alumno/ruta1/acceso/cuestionario/ipn/Retroalimentacion.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const PUB = process.env.PUBLIC_URL || '';

const Retroalimentacion = () => {
  const { rfId } = useParams();             // p.ej. "RF_5"
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);   // { title, slides: [{src}], navigation:{...}, backLink }
  const [idx, setIdx] = useState(0);

  // Fallback para el botón "Volver"
  const backFallback =
    (location.state && location.state.from) ||
    (data && data.backLink) ||
    '/alumno/acceso/cuestionario/ipn/medico-biologicas';

  // Carga manifest.json del RF correspondiente
  useEffect(() => {
    const load = async () => {
      try {
        const url = `${PUB}/cuestionarios/ipn/respuestas/${rfId}/manifest.json`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} al leer ${url}`);
        const json = await res.json();
        setData(json);
        if (Number.isInteger(json?.navigation?.startIndex)) {
          setIdx(json.navigation.startIndex);
        } else {
          setIdx(0);
        }
      } catch (err) {
        console.error('Error cargando manifest:', err);
        setData({ title: `Retroalimentación ${rfId}`, slides: [] });
        setIdx(0);
      }
    };
    load();
  }, [rfId]);

  // Navegación siguiente/anterior
  const next = useCallback(() => {
    if (!data?.slides?.length) return;
    const n = data.slides.length;
    const loop = data.navigation?.loop ?? true;
    setIdx((i) => (i + 1 < n ? i + 1 : loop ? 0 : i));
  }, [data]);

  const prev = useCallback(() => {
    if (!data?.slides?.length) return;
    const n = data.slides.length;
    const loop = data.navigation?.loop ?? true;
    setIdx((i) => (i - 1 >= 0 ? i - 1 : loop ? n - 1 : i));
  }, [data]);

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, navigate]);

  // Prefetch de siguiente y previa para transiciones suaves
  useEffect(() => {
    if (!data?.slides?.length) return;
    const n = data.slides.length;
    const nextIdx = (idx + 1) % n;
    const prevIdx = (idx - 1 + n) % n;
    [nextIdx, prevIdx].forEach((i) => {
      const img = new Image();
      img.src = `${PUB}/cuestionarios/ipn/respuestas/${rfId}/${data.slides[i].src}`;
    });
  }, [idx, data, rfId]);

  // Render
  if (!data) return <div style={{ padding: 24 }}>Cargando retroalimentación…</div>;
  const slide = data.slides?.[idx];
  if (!slide) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 12 }}>{data.title || `Retroalimentación ${rfId}`}</h2>
        <p>No se encontraron diapositivas en el manifest.</p>
        <button onClick={() => navigate(backFallback, { replace: false })}>Volver</button>
      </div>
    );
  }

  const showArrows = data.navigation?.showArrows ?? true;
  const showProgress = data.navigation?.showProgress ?? true;
  const src = `${PUB}/cuestionarios/ipn/respuestas/${rfId}/${slide.src}`;

  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>{data.title || `Retroalimentación ${rfId}`}</h2>

      <div style={{ textAlign: 'center' }}>
        <img
          src={src}
          alt={`Diapositiva ${idx + 1}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {showProgress && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          {idx + 1} / {data.slides.length}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
        {showArrows && <button onClick={prev}>← Anterior</button>}
        {showArrows && <button onClick={next}>Siguiente →</button>}
        <button onClick={() => navigate(backFallback, { replace: false })}>Volver</button>
      </div>
    </div>
  );
};

export default Retroalimentacion;
