// client/src/components/adminprincipal/ruta4/horarioGrupos/creaGrupos/tercerbimestre.js
// Lista de materias y bloques máximos asignables
export const materiasTercerBimestre = [
  { nombre: "Cálculo (Dif. e Int.)", bloques: 7 },
  { nombre: "Probabilidad y Estadística", bloques: 5 },
  { nombre: "Reading and Comprehension", bloques: 5 },
  { nombre: "Química III", bloques: 3 },
  { nombre: "Física III", bloques: 3 },
  { nombre: "Biología", bloques: 1 },
  { nombre: "Historia", bloques: 1 },
];

// Horario base con distribución validada (una celda vacía incluida)
export const horarioBaseTercerBimestre = [
  {
    hora: "07:00-08:00",
    materias: ["Cálculo (Dif. e Int.)", "Física III", "Probabilidad y Estadística", "Reading and Comprehension", "Química III"],
  },
  {
    hora: "08:10-09:10",
    materias: ["Cálculo (Dif. e Int.)", "Reading and Comprehension", "Probabilidad y Estadística", "Reading and Comprehension", "Reading and Comprehension"],
  },
  {
    hora: "09:20-10:20",
    materias: ["Cálculo (Dif. e Int.)", "Cálculo (Dif. e Int.)", "Probabilidad y Estadística", "Cálculo (Dif. e Int.)", "Cálculo (Dif. e Int.)"],
  },
  {
    hora: "10:30-11:30",
    materias: ["Probabilidad y Estadística", "Biología", "Cálculo (Dif. e Int.)", "Química III", "Historia"],
  },
  {
    hora: "11:40-12:40",
    materias: ["Química III", "Física III", "Física III", "Reading and Comprehension", "Probabilidad y Estadística"],
  },
];

// Función para ajustar horario según el turno y descansos de 10 minutos
export function generarHorarioConTurno(turno) {
  let horaInicio;

  switch (turno) {
    case "Matutino":
      horaInicio = 7;
      break;
    case "Mixto":
      horaInicio = 12;
      break;
    case "Vespertino":
      horaInicio = 16.5; // 16:30 horas
      break;
    default:
      horaInicio = 7;
  }

  return horarioBaseTercerBimestre.map((bloque, index) => {
    const inicio = horaInicio + index * 1.17; // 1hr + 10min = 1.17 hrs
    const fin = inicio + 1;

    const formatoHora = (horaDecimal) => {
      const h = Math.floor(horaDecimal);
      const m = Math.round((horaDecimal - h) * 60);
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    return {
      hora: `${formatoHora(inicio)}-${formatoHora(fin)}`,
      materias: bloque.materias,
    };
  });
}


