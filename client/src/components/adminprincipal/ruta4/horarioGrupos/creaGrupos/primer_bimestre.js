//ruta4/horarioGrupos/creaGrupos/primer_bimestre.js
// Lista de materias y bloques máximos asignables
// Lista de materias y bloques máximos asignables
export const materiasPrimerBimestre = [
  { nombre: "Álgebra", bloques: 7 },
  { nombre: "Pensamiento Matemático", bloques: 5 },
  { nombre: "Competencia Escrita", bloques: 5 },
  { nombre: "Química I", bloques: 3 },
  { nombre: "Física I", bloques: 3 },
  { nombre: "Biología", bloques: 1 },
  { nombre: "Historia", bloques: 1 },
];

// Horario base con una celda vacía para el equilibrio
export const horarioBasePrimerBimestre = [
  { hora: "", materias: ["Química I", "Competencia Escrita", "Historia", "Pensamiento Matemático", "Competencia Escrita"] },
  { hora: "", materias: ["Pensamiento Matemático", "Competencia Escrita", "Física I", "Pensamiento Matemático", "Biología"] },
  { hora: "", materias: ["Álgebra", "Álgebra", "Álgebra", "Álgebra", "Álgebra"] },
  { hora: "", materias: ["Álgebra", "Competencia Escrita", "Química I", "Pensamiento Matemático", "Química I"] },
  { hora: "", materias: ["Física I", "Física I", "Competencia Escrita", "Pensamiento Matemático", "Álgebra"] },
];

// Función para calcular formato HH:MM
function formatoHora(hora, minuto) {
  const hh = hora.toString().padStart(2, "0");
  const mm = minuto.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// Función para generar horario según turno con descansos de 10 minutos
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

  return horarioBasePrimerBimestre.map((bloque) => {
    const inicio = formatoHora(horaActual, minutoActual);

    // Avanza 1 hora
    minutoActual += 60;
    if (minutoActual >= 60) {
      horaActual += Math.floor(minutoActual / 60);
      minutoActual = minutoActual % 60;
    }

    const fin = formatoHora(horaActual, minutoActual);

    // Agrega descanso de 10 minutos
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
