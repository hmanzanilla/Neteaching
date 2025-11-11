//config/db.js
const mongoose = require('mongoose');

// Configuración mejorada de la conexión a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB:', mongoose.connection.host);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1); // Detiene la aplicación si falla la conexión
  }
};

// Evento para manejar la desconexión de MongoDB
mongoose.connection.on('disconnected', () => {
  console.warn('⚠ MongoDB se desconectó. Revisa tu conexión o credenciales.');
});

// Evento para manejar errores de conexión
mongoose.connection.on('error', (error) => {
  console.error('❌ Error en la conexión de MongoDB:', error);
});

module.exports = connectDB;