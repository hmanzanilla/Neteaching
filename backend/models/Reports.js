// models/Reports.js

const mongoose = require('mongoose');

// 📌 Función para determinar la colección según el rol del usuario
const getCollectionName = (role) => {
  switch (role) {
    case 'alumno': return 'historial_alumno_acceso';
    case 'maestro': return 'historial_maestro_acceso';
    case 'administrador': return 'historial_admin_acceso';
    case 'admin_principal': return 'historial_principal_acceso';
    default: return null;
  }
};

// 📌 Esquema de acceso para logs de inicio de sesión
const AccessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  role: { type: String, enum: ['alumno', 'maestro', 'administrador', 'admin_principal'], required: true },
  username: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  loginTime: { type: Date, default: Date.now } // Guarda la fecha y hora de acceso
});

// 📌 Función para registrar accesos en la colección correcta
const guardarAcceso = async (user) => {
  try {
    const collectionName = getCollectionName(user.role);
    if (!collectionName) throw new Error('Rol no válido');

    const AccesoModel = mongoose.model(collectionName, AccessSchema, collectionName);
    const nuevoAcceso = new AccesoModel({
      userId: user._id,
      role: user.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    await nuevoAcceso.save();
    console.log(`✅ Acceso registrado en ${collectionName} para ${user.username}`);
  } catch (error) {
    console.error('❌ Error al guardar el acceso:', error);
  }
};

module.exports = { guardarAcceso };
