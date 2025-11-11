//ipn/imagen.js
import React from 'react';

const Imagen = () => {
  return (
    <div>
      <h1>Imagen de Prueba</h1>
      <img src={process.env.PUBLIC_URL + '/imagenes/F_33.jpg'} alt="F_33" width="900" />
    </div>
  );
};

export default Imagen;
