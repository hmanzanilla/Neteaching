// 📁 ruta1/acceso/eleccion_grupo/SeleccionGrupo.js
import React, { useEffect, useState, useContext, useRef } from "react";
import axiosAlumno from "../../../../../axiosConfig/axiosAlumno";
import { UserContext } from "../../../../../context/UserContext";
import "./SeleccionGrupo.css";

const SeleccionGrupo = () => {
  const { userData, loading } = useContext(UserContext);

  const [bimestre, setBimestre] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  // Inscripción actual + estado de envío
  const [miInscripcion, setMiInscripcion] = useState(null); // { status, aula? }
  const [posting, setPosting] = useState(false);

  // Mensajes
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const horarioRef = useRef(null);

  // ---------- CARGA INICIAL ----------
  useEffect(() => {
    if (!loading && userData?._id) {
      (async () => {
        await obtenerBimestre();
        await obtenerMiInscripcion();
        await obtenerGruposHorarios();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userData]);

  // ---------- API CALLS ----------
  const obtenerBimestre = async () => {
    try {
      const res = await axiosAlumno.get("/api/leerBimestre");
      setBimestre(res.data.bimestre);
    } catch (err) {
      console.error("❌ Error al leer bimestre:", err);
      setError(err.response?.data?.error || "No se pudo obtener el bimestre.");
    }
  };

  const obtenerMiInscripcion = async () => {
    try {
      const res = await axiosAlumno.get("/api/seleccionarGrupo/mio");
      setMiInscripcion(res.data || { status: "none" });
    } catch (err) {
      console.warn("⚠️ No se pudo leer mi inscripción:", err?.response?.data || err.message);
      setMiInscripcion({ status: "none" });
    }
  };

  const obtenerGruposHorarios = async () => {
    try {
      const res = await axiosAlumno.get("/api/leerGruposHorarios");
      setGrupos(res.data);
    } catch (err) {
      console.error("❌ Error al leer grupos y horarios:", err);
      setError("No se pudieron cargar los horarios.");
    }
  };

  const inscribirmeEnGrupo = async (grupo) => {
    if (!grupo?.grupoId) return;
    setError("");
    setInfo("");
    setPosting(true);
    try {
      const res = await axiosAlumno.post("/api/seleccionarGrupo", { grupoId: grupo.grupoId });
      // Éxito (201): status confirmed + resumen aula
      setMiInscripcion({
        status: res.data?.status || "confirmed",
        aula: res.data?.aula,
        bimestre: res.data?.bimestre,
      });
      setInfo("✅ Asignación confirmada.");
      setHorarioSeleccionado(null);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        (status === 409
          ? "Ya tienes una inscripción en este bimestre."
          : "Ocurrió un error al registrar la inscripción.");
      setError(`❌ ${msg}`);
      console.error("❌ Error al inscribirme:", err);
    } finally {
      setPosting(false);
    }
  };

  // ---------- RENDER / DERIVADOS ----------
  const yaAsignado = (miInscripcion?.status || "").toLowerCase() === "confirmed";

  // Autoabrir el horario del grupo asignado y hacer scroll
  useEffect(() => {
    if (!yaAsignado || !grupos.length || horarioSeleccionado) return;

    const grupoIdAsignado =
      miInscripcion?.aula?.grupoId || miInscripcion?.grupoId || null;

    let match =
      (grupoIdAsignado && grupos.find(g => g.grupoId === grupoIdAsignado)) ||
      grupos.find(g =>
        g?.nombre === miInscripcion?.aula?.nombreGrupo &&
        g?.turno === miInscripcion?.aula?.turno &&
        g?.nombreHorario === miInscripcion?.aula?.nombreHorario
      );

    if (match) {
      setHorarioSeleccionado(match);
      // pequeño scroll para asegurar visibilidad del panel
      setTimeout(() => {
        horarioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [yaAsignado, grupos, miInscripcion, horarioSeleccionado]);

  const renderTurno = (turno) => {
    const filtrados = grupos.filter((g) => g.turno === turno);
    if (filtrados.length === 0) return null;

    return (
      <div key={turno} className={`columna-turno ${turno.toLowerCase()}`}>
        <h3>{turno}</h3>
        {filtrados.map((grupo) => (
          <button
            key={grupo.grupoId}
            onClick={() => setHorarioSeleccionado(grupo)}
            className="grupo-boton"
            title={`Ver horario de ${grupo.nombre}`}
          >
            {grupo.nombre} ({grupo.nombreHorario})
          </button>
        ))}
      </div>
    );
  };

  if (loading || !userData?._id) {
    return <div>⏳ Cargando usuario...</div>;
  }

  return (
    <div className="seleccion-grupos-container">
      <h2>📘 Selección de Grupo – {bimestre || "Cargando bimestre..."}</h2>

      {/* Banner de estado actual */}
      {yaAsignado && miInscripcion?.aula && (
        <div className="banner-ok" role="status" aria-live="polite">
          Ya estás asignado a: <strong>{miInscripcion.aula.nombreGrupo}</strong> — {miInscripcion.aula.turno} —{" "}
          {miInscripcion.aula.nombreHorario}
        </div>
      )}

      {/* Mensajes */}
      {info && <p className="msg-info">{info}</p>}
      {error && <p className="msg-error">{error}</p>}

      {grupos.length === 0 && !error && <p>🚫 No hay horarios disponibles por el momento.</p>}

      {/* Botonera por turno — OCULTA si ya está asignado */}
      {!yaAsignado && (
        <div className="botones-container">
          {["Matutino", "Mixto", "Vespertino"].map(renderTurno)}
        </div>
      )}

      {/* Panel de horario seleccionado */}
      {horarioSeleccionado && (
        <div ref={horarioRef} className="horario-container" role="dialog" aria-modal="true" aria-label="Horario del grupo seleccionado">
          <h3>
            Horario de {horarioSeleccionado.nombre} | Turno: {horarioSeleccionado.turno} | Bimestre{" "}
            {horarioSeleccionado.bimestre}
          </h3>

          <div className="horario-scroll">
            <table className="horario-tabla">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Lunes</th>
                  <th>Martes</th>
                  <th>Miércoles</th>
                  <th>Jueves</th>
                  <th>Viernes</th>
                </tr>
              </thead>
              <tbody>
                {horarioSeleccionado.horarioOrdenado.map(([hora, dias]) => (
                  <tr key={hora}>
                    <td>{hora}</td>
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((dia) => (
                      <td key={`${hora}-${dia}`}>
                        <strong>{dias[dia]?.materia || "-"}</strong>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Acciones: sólo cuando AÚN NO está asignado */}
          {!yaAsignado && (
            <div className="actions-bar sticky">
              <button className="btn btn-secondary" onClick={() => setHorarioSeleccionado(null)}>
                Cerrar
              </button>
              <button
                className="btn btn-primary btn-cta"
                onClick={() => inscribirmeEnGrupo(horarioSeleccionado)}
                disabled={posting}
              >
                {posting ? "Inscribiendo..." : "Inscribirme en este grupo"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeleccionGrupo;
