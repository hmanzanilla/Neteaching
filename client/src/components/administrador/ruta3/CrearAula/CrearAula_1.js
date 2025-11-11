// client/src/components/maestro/ruta2/CrearAula/CrearAula.js
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosMaestro from '../../../../axiosConfig/axiosMaestros';

// Días base; podrás activar Sábado/Domingo con switches
const DIAS_BASE = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00-23:59

const nuevaFila = (dias) => {
  const fila = { inicio: '08:00', fin: '09:00' };
  dias.forEach(d => { fila[d] = ''; });
  return fila;
};

export default function CrearAula() {
  const navigate = useNavigate();

  // ----- Metadatos del Aula -------
  const [nombre, setNombre] = useState('');
  const [grupoEtiqueta, setGrupoEtiqueta] = useState('');
  const [materia, setMateria] = useState('');
  const [tz, setTz] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City';
    } catch {
      return 'America/Mexico_City';
    }
  });

  // ----- Config de días del grid -----
  const [incluirSabado, setIncluirSabado] = useState(false);
  const [incluirDomingo, setIncluirDomingo] = useState(false);

  const dias = useMemo(() => {
    const base = [...DIAS_BASE];
    if (incluirSabado) base.push('Sábado');
    if (incluirDomingo) base.push('Domingo');
    return base;
  }, [incluirSabado, incluirDomingo]);

  // ----- Grid de filas (horarios) -----
  const [filas, setFilas] = useState([nuevaFila(DIAS_BASE)]);
  const [filasDeseadas, setFilasDeseadas] = useState(1);

  // mensajes UI
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text:string}

  // Si cambian los días, hay que asegurar que las filas tengan esas llaves
  const syncFilasConDias = (diasActuales) => {
    setFilas(prev => {
      return prev.map(f => {
        const nf = { inicio: f.inicio, fin: f.fin };
        diasActuales.forEach(d => { nf[d] = f[d] ?? ''; });
        return nf;
      });
    });
  };

  const onToggleSab = (val) => { setIncluirSabado(val); syncFilasConDias(val ? [...dias] : dias.filter(d => d !== 'Sábado')); };
  const onToggleDom = (val) => { setIncluirDomingo(val); syncFilasConDias(val ? [...dias] : dias.filter(d => d !== 'Domingo')); };

  // Cambiar número de filas “rápidamente”
  const aplicarFilasDeseadas = () => {
    const n = Math.max(0, Math.min(48, Number(filasDeseadas) || 0)); // límite sano
    setFilas(prev => {
      if (n === prev.length) return prev;
      if (n > prev.length) {
        const add = Array.from({ length: n - prev.length }, () => nuevaFila(dias));
        return [...prev, ...add];
      } else {
        return prev.slice(0, n);
      }
    });
  };

  const addFila = () => setFilas(prev => [...prev, nuevaFila(dias)]);
  const removeFila = (idx) => setFilas(prev => prev.filter((_, i) => i !== idx));

  const setCampoFila = (idx, campo, valor) => {
    setFilas(prev => prev.map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)));
  };

  // ---- Helpers de validación ----
  const toMin = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + m;
  };

  // Una fila es “vacía” si no hay ninguna materia en los días
  const filaVacia = (fila) => dias.every(d => !(fila[d] && String(fila[d]).trim()));

  // Valida que, si hay materias en la fila, el horario sea correcto
  const validarFila = (fila, idx) => {
    if (filaVacia(fila)) return { ok: true }; // se puede ignorar
    const { inicio, fin } = fila;
    if (!HHMM.test(inicio) || !HHMM.test(fin)) {
      return { ok: false, msg: `Fila ${idx + 1}: formato de hora inválido (usa HH:mm).` };
    }
    if (toMin(inicio) >= toMin(fin)) {
      return { ok: false, msg: `Fila ${idx + 1}: la hora de inicio debe ser menor que la de fin.` };
    }
    return { ok: true };
  };

  // Convierte nuestro estado a un grid “compacto” (solo llaves de días actuales)
  const buildGrid = () =>
    filas
      .map(f => {
        const obj = { inicio: f.inicio, fin: f.fin };
        dias.forEach(d => { obj[d] = f[d] || ''; });
        return obj;
      })
      // Podemos filtrar filas totalmente vacías para no enviar ruido
      .filter(f => !dias.every(d => !f[d] || !String(f[d]).trim()));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!nombre.trim() || !grupoEtiqueta.trim()) {
      setMsg({ type: 'err', text: 'El nombre del aula y la etiqueta del grupo son obligatorios.' });
      return;
    }

    // Validación básica por filas
    for (let i = 0; i < filas.length; i++) {
      const v = validarFila(filas[i], i);
      if (!v.ok) { setMsg({ type: 'err', text: v.msg }); return; }
    }

    const grid = buildGrid();
    if (grid.length === 0) {
      // Permitimos crear aula sin horarios (los podrás cargar luego),
      // pero avisamos por UX
      if (!window.confirm('No has definido horarios. ¿Crear aula sin horarios?')) return;
    }

    setEnviando(true);
    try {
      const payload = { nombre, grupoEtiqueta, tz, materia: materia.trim(), grid };
      const { data } = await axiosMaestro.post('/api/maestro/crear-aulas', payload, { withCredentials: true });

      setMsg({ type: 'ok', text: 'Aula creada correctamente.' });
      // Redirige a seleccionar aula para continuar
      navigate('/maestro/ruta2/elegir-aula', { replace: true, state: { nuevaAulaId: data?.aula?._id } });
    } catch (err) {
      const apiMsg = err?.response?.data?.message || 'Error creando el aula.';
      setMsg({ type: 'err', text: apiMsg });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="maestro-content">
      <h2>Crear Aula Virtual</h2>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 980 }}>
        {/* --- Metadatos --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Nombre del aula *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="p.ej. Física 2 - Grupo B"
            />
          </div>

          <div>
            <label>Etiqueta del grupo *</label>
            <input
              value={grupoEtiqueta}
              onChange={(e) => setGrupoEtiqueta(e.target.value)}
              placeholder="p.ej. Fisica_2_B"
            />
          </div>

          <div>
            <label>Materia (opcional)</label>
            <input
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="p.ej. Física"
            />
          </div>

          <div>
            <label>Zona horaria</label>
            <input
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              placeholder="America/Mexico_City"
              title="IANA TZ (ej. America/Mexico_City)"
            />
          </div>
        </div>

        {/* --- Config de días --- */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={incluirSabado} onChange={(e) => onToggleSab(e.target.checked)} />
            Incluir Sábado
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={incluirDomingo} onChange={(e) => onToggleDom(e.target.checked)} />
            Incluir Domingo
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Número de filas:</label>
            <input
              type="number"
              min={0}
              max={48}
              value={filasDeseadas}
              onChange={(e) => setFilasDeseadas(e.target.value)}
              style={{ width: 80 }}
            />
            <button type="button" onClick={aplicarFilasDeseadas}>Aplicar</button>
            <button type="button" onClick={addFila}>➕ Agregar fila</button>
          </div>
        </div>

        {/* --- Tabla Grid --- */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Inicio</th>
                <th style={th}>Fin</th>
                {dias.map(d => (
                  <th key={d} style={th}>{d}</th>
                ))}
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={idx}>
                  <td style={td}>
                    <input
                      type="time"
                      value={fila.inicio}
                      onChange={(e) => setCampoFila(idx, 'inicio', e.target.value)}
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="time"
                      value={fila.fin}
                      onChange={(e) => setCampoFila(idx, 'fin', e.target.value)}
                    />
                  </td>

                  {dias.map(d => (
                    <td key={d} style={td}>
                      <input
                        value={fila[d] || ''}
                        onChange={(e) => setCampoFila(idx, d, e.target.value)}
                        placeholder="Materia o vacío"
                      />
                    </td>
                  ))}

                  <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => removeFila(idx)}>✖</button>
                  </td>
                </tr>
              ))}

              {filas.length === 0 && (
                <tr><td style={td} colSpan={2 + dias.length + 1}>Sin filas. Agrega una fila para comenzar.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Mensajes --- */}
        {msg && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${msg.type === 'ok' ? '#3cab5b' : '#d33'}`,
              background: msg.type === 'ok' ? '#eaf9ef' : '#fdeeee',
              color: msg.type === 'ok' ? '#0a6a2a' : '#8a1111',
            }}
          >
            {msg.text}
          </div>
        )}

        {/* --- Acciones --- */}
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar Aula'}
          </button>
          <button type="button" onClick={() => navigate('/maestro/ruta2')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

// --- estilos de celdas simples (heredan tu maestro-content) ---
const th = {
  textAlign: 'left',
  borderBottom: '1px solid #e6e9f2',
  padding: 8,
  fontWeight: 600
};
const td = {
  borderBottom: '1px solid #f0f2f7',
  padding: 6
};
