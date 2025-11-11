// middleware/general/leerVideos.js
module.exports = function (req, res, next) {
  const { categoria } = req.query;

  const categoriasPermitidas = [
    "Biología",
    "Física",
    "Matemáticas",
    "Química",
    "Historia",
    "Competencia Escrita",
    "Competencia Lectora",
    "Reading Comprehension"
  ];

  if (!categoria) return next();

  // Normaliza la categoría recibida (mayúsculas, espacios extras)
  const categoriaNormalizada = categoria.trim().toLowerCase();

  const esValida = categoriasPermitidas.some(cat => 
    cat.toLowerCase() === categoriaNormalizada
  );

  if (!esValida) {
    return res.status(400).json({
      message: `Categoría inválida. Categorías válidas: ${categoriasPermitidas.join(", ")}.`
    });
  }

  next();
};
