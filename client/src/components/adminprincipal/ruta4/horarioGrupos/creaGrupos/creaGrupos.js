// client/src/components/adminprincipal/ruta4/horarioGrupos/creaGrupos/creaGrupos.js
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../../../context/UserContext";
import { generarHorarioConTurno as horario1, materiasPrimerBimestre } from "./primer_bimestre";
import { generarHorarioConTurno as horario2, materiasSegundoBimestre } from "./segundo_bimestre";
import { generarHorarioConTurno as horario3, materiasTercerBimestre } from "./tercer_bimestre";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const curpProfesores = ["MEPHHYNNRC03"];

const CrearGrupos = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userData, loading } = useContext(UserContext);

  const [nombreGrupo, setNombreGrupo] = useState("");
  const [turno, setTurno] = useState("Matutino");
  const [bimestre, setBimestre] = useState("1");
  const [horario, setHorario] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !userData || (userData.role || userData?.user?.role) !== "admin_principal")) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, userData, navigate]);

  useEffect(() => {
    let horarioGen, materiasGen;
    switch (bimestre) {
      case "1":
        horarioGen = horario1(turno);
        materiasGen = materiasPrimerBimestre;
        break;
      case "2":
        horarioGen = horario2(turno);
        materiasGen = materiasSegundoBimestre;
        break;
      case "3":
        horarioGen = horario3(turno);
        materiasGen = materiasTercerBimestre;
        break;
      default:
        horarioGen = horario1(turno);
        materiasGen = materiasPrimerBimestre;
    }
    const nuevoHorario = horarioGen.map(b => ({
      hora: b.hora,
      materias: b.materias.map((m, j) => ({ materia: m, curpProfesor: curpProfesores[j % curpProfesores.length] }))
    }));
    setHorario(nuevoHorario);
    setMaterias(materiasGen);
  }, [turno, bimestre]);

  const handleMateriaChange = (horaIdx, diaIdx, nuevaMateria) => {
    const nuevaLista = [...horario];
    nuevaLista[horaIdx].materias[diaIdx].materia = nuevaMateria;
    setHorario(nuevaLista);
  };

  const handleCurpChange = (horaIdx, diaIdx, nuevaCurp) => {
    const nuevaLista = [...horario];
    nuevaLista[horaIdx].materias[diaIdx].curpProfesor = nuevaCurp;
    setHorario(nuevaLista);
  };

  const contarMaterias = () => {
    const conteo = {};
    materias.forEach(m => (conteo[m.nombre] = 0));
    horario.forEach(bloque => {
      bloque.materias.forEach(celda => {
        if (celda.materia && conteo[celda.materia] !== undefined) conteo[celda.materia]++;
      });
    });
    return conteo;
  };

  const guardarHorario = async () => {
    if (!nombreGrupo || !turno || !bimestre) {
      setError("Faltan datos del grupo");
      return;
    }
    setIsSaving(true);
    try {
      const admin_creador = userData?.user?._id || userData?._id || userData?.id;
      const curpProfesor = curpProfesores[0];

      const grupoRes = await axios.post(`${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/grupos`, {
        nombre: nombreGrupo,
        turno,
        bimestre: parseInt(bimestre),
        curpProfesor,
        admin_creador
      }, { withCredentials: true });

      const grupoId = grupoRes.data.grupo?._id;

      const horarioFinal = {
        Lunes: [],
        Martes: [],
        Miércoles: [],
        Jueves: [],
        Viernes: []
      };

      horario.forEach(bloque => {
        const hora = bloque.hora;
        diasSemana.forEach((dia, i) => {
          const celda = bloque.materias[i];
          horarioFinal[dia].push({
            hora,
            materia: celda.materia,
            curpProfesor: celda.curpProfesor
          });
        });
      });

      await axios.post(`${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/horarios`, {
        grupoId,
        nombreHorario: `Horario ${turno}`,
        bimestre: parseInt(bimestre),
        horario: horarioFinal
      }, { withCredentials: true });

      alert("Grupo y horario guardados correctamente.");
      navigate("/adminprincipal/horario-grupos/verGrupos");
    } catch (err) {
      console.error(err);
      alert("Error al guardar grupo y horario.");
    }
    setIsSaving(false);
  };

  const conteo = contarMaterias();

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>Crear Horario de Grupo</h2>
      <label>
        Nombre del Grupo:
        <input value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} />
      </label><br />
      <label>
        Turno:
        <select value={turno} onChange={(e) => setTurno(e.target.value)}>
          <option>Matutino</option>
          <option>Mixto</option>
          <option>Vespertino</option>
        </select>
      </label><br />
      <label>
        Bimestre:
        <select value={bimestre} onChange={(e) => setBimestre(e.target.value)}>
          <option value="1">Primer Bimestre</option>
          <option value="2">Segundo Bimestre</option>
          <option value="3">Tercer Bimestre</option>
        </select>
      </label>

      <table style={{ margin: "20px auto", borderCollapse: "collapse" }}>
        <thead>
          <tr><th>Hora</th>{diasSemana.map(d => <th key={d}>{d}</th>)}</tr>
        </thead>
        <tbody>
          {horario.map((bloque, i) => (
            <tr key={i}>
              <td>{bloque.hora}</td>
              {diasSemana.map((_, j) => {
                const celda = bloque.materias[j];
                const max = materias.find(m => m.nombre === celda.materia)?.bloques || 0;
                const usados = conteo[celda.materia] || 0;
                const color = celda.materia === "" ? "white" : usados > max ? "red" : usados < max ? "yellow" : "white";
                return (
                  <td key={j} style={{ backgroundColor: color }}>
                    <select value={celda.materia} onChange={(e) => handleMateriaChange(i, j, e.target.value)}>
                      <option value="">---</option>
                      {materias.map(m => (
                        <option key={m.nombre} value={m.nombre}>{m.nombre}</option>
                      ))}
                    </select>
                    <br />
                    <select value={celda.curpProfesor} onChange={(e) => handleCurpChange(i, j, e.target.value)}>
                      {curpProfesores.map(curp => (
                        <option key={curp} value={curp}>{curp}</option>
                      ))}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={guardarHorario} disabled={isSaving}>
        {isSaving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
};

export default CrearGrupos;
