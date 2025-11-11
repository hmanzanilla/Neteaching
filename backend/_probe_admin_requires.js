// backend/probe_admin_requires.js
// backend/_probe_admin_requires.js
const path = require("path");

const list = [
  "./routes/administrador/auth_administrador",
  "./routes/administrador/crear_aulas",
  "./routes/administrador/aulas_estado",
  "./routes/marcarConectado",
  "./routes/register",
  "./routes/general/fotosPerfil",
  "./routes/general/leerGruposHorarios",
];

for (const p of list) {
  try {
    const abs = path.join(__dirname, p);
    const mod = require(abs);
    console.log(`✅ require("${p}") OK`);
  } catch (e) {
    console.error(`❌ require("${p}") FALLÓ: ${e.message}`);
  }
}
