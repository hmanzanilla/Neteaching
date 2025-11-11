// cargar_cuestionario.js
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGO_URI;
const csvPath = process.env.CSV_PATH; // 👉 Define esta variable en tu .env

if (!url) {
  console.error('❌ MONGO_URI no está definida en el entorno.');
  process.exit(1);
}

if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('❌ CSV_PATH no está definido o el archivo no existe:', csvPath);
  process.exit(1);
}

console.log('🚀 Paso 1: Iniciando conexión a MongoDB Atlas...');

mongoose.connect(url)
  .then(async () => {
    console.log('✅ Conectado a la base de datos');

    const CuestionarioSchema = new mongoose.Schema({
      pregunta: String,
      opciones: [String],
      respuestaCorrecta: String,
    });

    const Cuestionario = mongoose.model('Cuestionario', CuestionarioSchema);

    await Cuestionario.deleteMany({});
    console.log('🧹 Documentos anteriores eliminados');

    const inserciones = [];

    console.log('📥 Paso 2: Iniciando lectura del CSV...');

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Pregunta && row['a)'] && row['b)'] && row['c)'] && row['d)'] && row['Respuesta Correcta']) {
          const doc = new Cuestionario({
            pregunta: row.Pregunta,
            opciones: [row['a)'], row['b)'], row['c)'], row['d)']],
            respuestaCorrecta: row['Respuesta Correcta'],
          });

          inserciones.push(
            doc.save()
              .then(res => console.log('✅ Insertado:', res._id))
              .catch(err => console.error('❌ Error insertando documento:', err))
          );
        } else {
          console.warn('⚠ Fila incompleta o malformada:', row);
        }
      })
      .on('end', async () => {
        console.log('📦 Archivo CSV procesado');
        await Promise.all(inserciones);
        mongoose.connection.close();
        console.log('🔒 Conexión a la base de datos cerrada');
      })
      .on('error', (error) => {
        console.error('❌ Error leyendo CSV:', error);
        mongoose.connection.close();
      });
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
  });