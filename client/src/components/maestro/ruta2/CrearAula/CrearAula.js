// client/src/components/maestro/ruta2/CrearAula/CrearAula.js
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosMaestro from '../../../../axiosConfig/axiosMaestros';
import './CrearAula.css';

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

      <form className="crearAula-form" onSubmit={onSubmit}>
        {/* --- Metadatos --- */}
        <div className="crearAula-meta">
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
        <div className="crearAula-dias">
          <label className="crearAula-check">
            <input type="checkbox" checked={incluirSabado} onChange={(e) => onToggleSab(e.target.checked)} />
            Incluir Sábado
          </label>
          <label className="crearAula-check">
            <input type="checkbox" checked={incluirDomingo} onChange={(e) => onToggleDom(e.target.checked)} />
            Incluir Domingo
          </label>

          <div className="crearAula-filasControls">
            <label>Número de filas:</label>
            <input
              type="number"
              min={0}
              max={48}
              value={filasDeseadas}
              onChange={(e) => setFilasDeseadas(e.target.value)}
            />
            <button type="button" onClick={aplicarFilasDeseadas}>Aplicar</button>
            <button type="button" onClick={addFila}>➕ Agregar fila</button>
          </div>
        </div>

        {/* --- Tabla Grid --- */}
        <div className="crearAula-tablaWrapper">
          <table className="crearAula-tabla">
            <thead>
              <tr>
                <th>Inicio</th>
                <th>Fin</th>
                {dias.map(d => (
                  <th key={d}>{d}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="time"
                      value={fila.inicio}
                      onChange={(e) => setCampoFila(idx, 'inicio', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={fila.fin}
                      onChange={(e) => setCampoFila(idx, 'fin', e.target.value)}
                    />
                  </td>

                  {dias.map(d => (
                    <td key={d}>
                      <input
                        value={fila[d] || ''}
                        onChange={(e) => setCampoFila(idx, d, e.target.value)}
                        placeholder="Materia o vacío"
                      />
                    </td>
                  ))}

                  <td className="crearAula-accionesFila">
                    <button type="button" onClick={() => removeFila(idx)}>✖</button>
                  </td>
                </tr>
              ))}

              {filas.length === 0 && (
                <tr><td className="crearAula-tdVacio" colSpan={2 + dias.length + 1}>Sin filas. Agrega una fila para comenzar.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Mensajes --- */}
        {msg && (
          <div className={`crearAula-msg ${msg.type === 'ok' ? 'crearAula-msgOk' : 'crearAula-msgErr'}`}>
            {msg.text}
          </div>
        )}

        {/* --- Acciones --- */}
        <div className="crearAula-acciones">
          <button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar Aula'}
          </button>
          <button type="button" onClick={() => navigate('/maestro/ruta2')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
