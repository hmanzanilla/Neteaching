// client/src/components/adminprincipal/ruta4/horarioGrupos/verGrupos/verGrupos.js
import React, { useState, useEffect, useContext } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./verGrupos.css";
import { UserContext } from "../../../../../context/UserContext";
import axiosAdmin from "../../../../../axiosConfig/axiosAdmin";

const VerGrupos = () => {
  const { isAuthenticated, loading } = useContext(UserContext);
  const [grupos, setGrupos] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  useEffect(() => {
    if (loading) return;
    fetchHorarios();
  }, [loading]);

  const fetchHorarios = async () => {
    try {
      // usa SIEMPRE axiosAdmin para que incluya baseURL y cookies
      const { data } = await axiosAdmin.get("/api/leerhorarios", { withCredentials: true });
      const datos = (data || []).map((g) => ({ ...g, grupoId: g.grupoId || g._id }));
      setGrupos(datos);
    } catch (error) {
      const s = error?.response?.status;
      const m = error?.response?.data?.message || error.message;
      console.warn(`🚨 No autorizado/err al leer horarios. status=${s} msg=${m}`);
    }
  };

  const seleccionarGrupo = (grupoId) => {
    const g = grupos.find((x) => x.grupoId === grupoId);
    if (g) setHorarioSeleccionado(g);
  };

  const eliminarGrupo = async (grupoId, nombreGrupo) => {
    if (!window.confirm(`¿Eliminar el grupo '${nombreGrupo}'?`)) return;
    try {
      await axiosAdmin.delete(`/api/eliminarGrupo/${grupoId}`, { withCredentials: true });
      await fetchHorarios();
    } catch (error) {
      const s = error?.response?.status;
      const m = error?.response?.data?.message || error.message;
      console.error(`❌ Error al eliminar. status=${s} msg=${m}`);
      alert("❌ Hubo un problema al eliminar el grupo.");
    }
  };

  const exportarAPDF = () => {
    if (!horarioSeleccionado) return;
    const doc = new jsPDF();
    doc.text(
      `Grupo: ${horarioSeleccionado.grupo} | Turno: ${horarioSeleccionado.turno} | Bimestre: ${horarioSeleccionado.bimestre}`,
      10,
      10
    );
    const columnas = ["Hora", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const filas = horarioSeleccionado.horarioOrdenado.map(([hora, dias]) => ([
      hora,
      ...["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(
        (d) => `${dias[d]?.materia || "-"} (${dias[d]?.nombreProfesor || ""})`
      ),
    ]));
    doc.autoTable({ head: [columnas], body: filas, startY: 20 });
    doc.save(`Horario_${horarioSeleccionado.grupo}_${horarioSeleccionado.bimestre}.pdf`);
  };

  const cerrarHorario = () => setHorarioSeleccionado(null);

  const renderTurno = (turno, bimestre) => {
    const gruposFiltrados = grupos.filter((g) => g.turno === turno && g.bimestre === bimestre);
    return (
      <div key={`${turno}-${bimestre}`} className={`columna-turno ${turno.toLowerCase()}`}>
        <h4>{turno}</h4>
        {gruposFiltrados.map((grupo) => (
          <div key={grupo.grupoId} className="grupo-opcion">
            <button className="grupo-boton" onClick={() => seleccionarGrupo(grupo.grupoId)}>
              {grupo.grupo} ({grupo.nombreHorario})
            </button>
            <button className="eliminar-boton" onClick={() => eliminarGrupo(grupo.grupoId, grupo.grupo)}>
              ❌
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ver-grupos-container">
      <h2>Listado de Grupos por Bimestre</h2>
      {[1, 2, 3].map((bimestre) => (
        <div key={bimestre} className="bimestre-bloque">
          <h3>Bimestre {bimestre}</h3>
          <div className="botones-container">
            {["Matutino", "Mixto", "Vespertino"].map((turno) => renderTurno(turno, bimestre))}
          </div>
        </div>
      ))}

      {horarioSeleccionado && (
        <div className="horario-container">
          <h3>
            Horario de {horarioSeleccionado.grupo} | Turno: {horarioSeleccionado.turno} | Bimestre{" "}
            {horarioSeleccionado.bimestre}
          </h3>
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
                      <strong>{dias[dia]?.materia || "-"}</strong><br />
                      <small>{dias[dia]?.nombreProfesor || ""}</small>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button className="exportar-pdf" onClick={exportarAPDF}>Exportar a PDF</button>
          <button className="cerrar-horario" onClick={cerrarHorario}>Cerrar Horario</button>
        </div>
      )}
    </div>
  );
};

export default VerGrupos;