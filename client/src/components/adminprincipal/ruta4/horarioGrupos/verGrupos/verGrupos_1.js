// ruta4/admin-principal/ruta4/horarioGRupos/verGrupos/verGrupos.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./verGrupos.css"; // Estilos minimalistas

const VerGrupos = () => {
  const [grupos, setGrupos] = useState([]); // Estado para almacenar los grupos
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null); // Estado para el horario seleccionado

  // ✅ Obtener los grupos y horarios al cargar la página
  useEffect(() => {
    const fetchHorarios = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ No hay token disponible, usuario no autenticado.");
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/leerhorarios`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setGrupos(response.data);
      } catch (error) {
        console.error("❌ Error al obtener los horarios:", error);
      }
    };

    fetchHorarios();
  }, []);

  // ✅ Manejar la selección de un grupo para ver su horario
  const seleccionarGrupo = (grupoId) => {
    const grupoSeleccionado = grupos.find((grupo) => grupo.grupoId === grupoId);
    if (grupoSeleccionado) {
      setHorarioSeleccionado(grupoSeleccionado);
    }
  };

  // ✅ Función para exportar la tabla a PDF
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

  // ✅ Función para cerrar el horario y volver a la vista de selección
  const cerrarHorario = () => {
    setHorarioSeleccionado(null);
  };

  return (
    <div className="ver-grupos-container">
      <h2>Listado de Grupos</h2>

      {/* 🔹 Contenedor de botones organizados en columnas por turno */}
      <div className="botones-container">
        {["Matutino", "Vespertino", "Mixto"].map((turno) => (
          <div key={turno} className={`columna-turno ${turno.toLowerCase()}`}>
            <h3>{turno}</h3>
            {grupos
              .filter((grupo) => grupo.nombreHorario.includes(turno))
              .map((grupo) => (
                <button
                  key={grupo.grupoId}
                  className="grupo-boton"
                  onClick={() => seleccionarGrupo(grupo.grupoId)}
                >
                  {grupo.grupo} ({grupo.nombreHorario})
                </button>
              ))}
          </div>
        ))}
      </div>

      {/* 🔹 Tabla del horario seleccionado */}
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
          <button className="exportar-pdf" onClick={exportarAPDF}>
            Exportar a PDF
          </button>
          <button className="cerrar-horario" onClick={cerrarHorario}>
            Cerrar Horario
          </button>
        </div>
      )}
    </div>
  );
};

export default VerGrupos;
