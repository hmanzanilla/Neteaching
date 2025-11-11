// 📁 src/components/alumno/ruta1/acceso/perfil/cropImage.js
// Recorta una imagen (JPG, PNG o WEBP) y devuelve un Blob listo para subir.

export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  type = 'image/jpeg',
  quality = 0.95
) {
  // 🔹 Detectar tipo automáticamente si es posible
  let detectedType = type;
  if (imageSrc?.toLowerCase?.().endsWith('.png')) detectedType = 'image/png';
  else if (imageSrc?.toLowerCase?.().endsWith('.webp')) detectedType = 'image/webp';
  else if (imageSrc?.toLowerCase?.().endsWith('.jpg') || imageSrc?.toLowerCase?.().endsWith('.jpeg'))
    detectedType = 'image/jpeg';

  const img = new Image();
  img.src = imageSrc;

  // 🔹 Esperar a que la imagen cargue correctamente
  if ('decode' in img) {
    try {
      await img.decode();
    } catch {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    }
  } else {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  }

  // 🔹 Crear canvas para el recorte
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width * dpr;
  canvas.height = pixelCrop.height * dpr;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // 🔹 Exportar como Blob (JPG, PNG o WEBP)
  const blob = await new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b), detectedType, quality);
    } else {
      const dataURL = canvas.toDataURL(detectedType, quality);
      resolve(dataURLToBlob(dataURL));
    }
  });

  return blob;
}

// 🔹 Conversión auxiliar: DataURL → Blob
function dataURLToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8 = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
  return new Blob([u8], { type: mime });
}
