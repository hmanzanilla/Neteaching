// middleware/general/cargaVideos.js
module.exports = function (req, res, next) {
  const { url, categoria, nombreVideo } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: "La URL del video es obligatoria y debe ser un texto." });
  }

  if (!categoria || typeof categoria !== 'string') {
    return res.status(400).json({ message: "La categoría del video es obligatoria y debe ser un texto válido." });
  }

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

  if (!categoriasPermitidas.includes(categoria)) {
    return res.status(400).json({ message: `La categoría proporcionada no es válida. Las categorías permitidas son: ${categoriasPermitidas.join(", ")}.` });
  }

  if (nombreVideo && typeof nombreVideo !== 'string') {
    return res.status(400).json({ message: "El nombre del video debe ser un texto." });
  }

  next();
};
