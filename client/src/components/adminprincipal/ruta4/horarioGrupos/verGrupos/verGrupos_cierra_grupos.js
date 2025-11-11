// client/src/components/adminprincipal/ruta4/horarioGrupos/verGrupos/verGrupos_cierra_grupos.js
import React, { useState, useEffect } from "react";
import axiosAdmin from "../../../../../axiosConfig/axiosAdmin"; // ✅ Usamos instancia con baseURL
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./verGrupos.css";

const VerGrupos = () => {
  const [grupos, setGrupos] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  useEffect(() => {
    fetchHorarios();
  }, []);

  const fetchHorarios = async () => {
    try {
      const response = await axiosAdmin.get("/api/leerhorarios");
      console.log("📌 Horarios obtenidos:", response.data);

      setGrupos(response.data.map(grupo => ({
        ...grupo,
        grupoId: grupo.grupoId || grupo._id,
      })));
    } catch (error) {
      console.error("❌ Error al obtener los horarios:", error);
    }
  };

  const seleccionarGrupo = (grupoId) => {
    const grupoSeleccionado = grupos.find((grupo) => grupo.grupoId === grupoId);
    if (grupoSeleccionado) {
      setHorarioSeleccionado(grupoSeleccionado);
    }
  };

  const eliminarGrupo = async (grupoId, nombreGrupo) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar el grupo '${nombreGrupo}'?`);
    if (!confirmar) return;

    try {
      await axiosAdmin.delete(`/api/eliminarGrupo/${grupoId}`);
      alert(`✅ Grupo '${nombreGrupo}' eliminado con éxito.`);
      fetchHorarios();
    } catch (error) {
      console.error("❌ Error al eliminar el grupo:", error);
      alert("❌ Hubo un problema al eliminar el grupo.");
    }
  };

  const exportarAPDF = () => {
    if (!horarioSeleccionado) return;

    const doc = new jsPDF();
    doc.text(`Horario del Grupo: ${horarioSeleccionado.nombreHorario}`, 10, 10);

    const columnas = ["Hora", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const filas = [];

    Object.entries(horarioSeleccionado.horario).forEach(([hora, dias]) => {
      filas.push([
        hora,
        dias["Lunes"]?.materia || "-",
        dias["Martes"]?.materia || "-",
        dias["Miércoles"]?.materia || "-",
        dias["Jueves"]?.materia || "-",
        dias["Viernes"]?.materia || "-",
      ]);
    });

    doc.autoTable({ head: [columnas], body: filas, startY: 20 });
    doc.save(`Horario_${horarioSeleccionado.nombreHorario}.pdf`);
  };

  const cerrarHorario = () => {
    setHorarioSeleccionado(null);
  };

  return (
    <div className="ver-grupos-container">
      <h2>Listado de Grupos</h2>

      <div className="botones-container">
        {["Matutino", "Vespertino", "Mixto"].map((turno) => (
          <div key={turno} className={`columna-turno ${turno.toLowerCase()}`}>
            <h3>{turno}</h3>
            {grupos
              .filter((grupo) => grupo.nombreHorario.includes(turno))
              .map((grupo) => {
                const idGrupo = grupo.grupoId || grupo._id;

                return (
                  <div key={idGrupo} className="grupo-opcion">
                    <button className="grupo-boton" onClick={() => seleccionarGrupo(idGrupo)}>
                      {grupo.grupo} ({grupo.nombreHorario})
                    </button>
                    <button className="eliminar-boton" onClick={() => eliminarGrupo(idGrupo, grupo.grupo)}>
                      ❌
                    </button>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {horarioSeleccionado && (
        <div className="horario-container">
          <h3>Horario de {horarioSeleccionado.nombreHorario}</h3>
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
              {Object.entries(horarioSeleccionado.horario).map(([hora, dias]) => (
                <tr key={hora}>
                  <td>{hora}</td>
                  {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((dia) => (
                    <td key={`${hora}-${dia}`}>{dias[dia]?.materia || "-"}</td>
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