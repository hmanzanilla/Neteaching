// middlewares/admin_principal/grupos.js
function validarGrupo(req, res, next) {
  const { nombre, turno, bimestre, curpProfesor } = req.body; // 🔄 CAMBIO aquí

  if (!nombre || !turno || !bimestre || !curpProfesor) { // 🔄 CAMBIO aquí
    return res.status(400).json({
      error: "Todos los campos son obligatorios: nombre, turno, bimestre, curpProfesor" // 🔄 CAMBIO aquí
    });
  }

  const turnosValidos = ["Matutino", "Vespertino", "Mixto"];
  if (!turnosValidos.includes(turno)) {
    return res.status(400).json({
      error: "El turno debe ser Matutino, Vespertino o Mixto"
    });
  }

  const bimestreNum = Number(bimestre);
  if (![1, 2, 3].includes(bimestreNum)) {
    return res.status(400).json({
      error: "El bimestre debe ser 1, 2 o 3"
    });
  }

  next();
}

module.exports = { validarGrupo };
