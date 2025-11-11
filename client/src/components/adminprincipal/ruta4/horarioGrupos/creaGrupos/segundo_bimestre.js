// client/src/components/adminprincipal/ruta4/horarioGrupos/creaGrupos/segundo_bimestre.js

// Lista de materias y bloques máximos asignables
// Lista de materias y bloques máximos asignables
export const materiasSegundoBimestre = [
  { nombre: "Geometría", bloques: 5 },
  { nombre: "Trigonometría", bloques: 4 },
  { nombre: "Competencia Lectora", bloques: 5 },
  { nombre: "Química II", bloques: 4 },
  { nombre: "Física II", bloques: 4 },
  { nombre: "Biología", bloques: 1 },
  { nombre: "Historia", bloques: 1 },
];

// Horario base con distribución validada (una celda vacía incluida)
export const horarioBaseSegundoBimestre = [
  {
    hora: "", // Se asignará dinámicamente según el turno
    materias: ["Química II", "Geometría", "Química II", "Competencia Lectora", "Física II"],
  },
  {
    hora: "",
    materias: ["Química II", "Trigonometría", "Física II", "Trigonometría", "Trigonometría"],
  },
  {
    hora: "",
    materias: ["Competencia Lectora", "Geometría", "Química II", "Historia", "Física II"],
  },
  {
    hora: "",
    materias: ["Biología", "Trigonometría", "Geometría", "Geometría", "Competencia Lectora"],
  },
  {
    hora: "",
    materias: ["Geometría", "Física II", "Competencia Lectora", "Competencia Lectora", ""],
  },
];

// Función auxiliar para formato HH:MM
function formatoHora(hora, minuto) {
  const hh = hora.toString().padStart(2, "0");
  const mm = minuto.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// Generador dinámico de horarios con descansos de 10 minutos
export function generarHorarioConTurno(turno) {
  let horaInicio, minutoInicio;

  switch (turno) {
    case "Matutino":
      horaInicio = 7;
      minutoInicio = 0;
      break;
    case "Mixto":
      horaInicio = 12;
      minutoInicio = 0;
      break;
    case "Vespertino":
      horaInicio = 16;
      minutoInicio = 30;
      break;
    default:
      horaInicio = 7;
      minutoInicio = 0;
  }

  let horaActual = horaInicio;
  let minutoActual = minutoInicio;

  return horarioBaseSegundoBimestre.map((bloque) => {
    const inicio = formatoHora(horaActual, minutoActual);

    // Avanza 1 hora
    minutoActual += 60;
    if (minutoActual >= 60) {
      horaActual += Math.floor(minutoActual / 60);
      minutoActual = minutoActual % 60;
    }

    const fin = formatoHora(horaActual, minutoActual);

    // Agrega 10 minutos de descanso
    minutoActual += 10;
    if (minutoActual >= 60) {
      horaActual += Math.floor(minutoActual / 60);
      minutoActual = minutoActual % 60;
    }

    return {
      hora: `${inicio}-${fin}`,
      materias: bloque.materias,
    };
  });
}
