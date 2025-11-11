// C:\Users\znava\Desktop\SERVIDOR\servidor_bcryptjs_1\client\src\components\alumno\ruta1\cuestionario\Principal_Cuestionario.js
import React from 'react';
import { Link } from 'react-router-dom';

const Principal_Cuestionario = () => {
  return (
    <div>
      <h1>¡Bienvenido!</h1>
      <div className="botones-cuestionario">
        <Link to="/cuestionario/ipn/medico-biologicas">IPN: Ciencias Médico Biológicas</Link>
        <Link to="/cuestionario/ipn/sociales-administrativas">IPN: Ciencias Sociales y Administrativas</Link>
        <Link to="/cuestionario/ipn/ingenieria">IPN: Ingeniería Ciencias Físico Matemáticas</Link>
        <Link to="/cuestionario/unam/medico-biologicas">UNAM: Ciencias Médico Biológicas</Link>
        <Link to="/cuestionario/unam/sociales-administrativas">UNAM: Ciencias Sociales y Administrativas</Link>
        <Link to="/cuestionario/unam/ingenieria">UNAM: Ingeniería Ciencias Físico Matemáticas</Link>
        <Link to="/cuestionario/uam/medico-biologicas">UAM: Ciencias Médico Biológicas</Link>
        <Link to="/cuestionario/uam/sociales-administrativas">UAM: Ciencias Sociales y Administrativas</Link>
        <Link to="/cuestionario/uam/ingenieria">UAM: Ingeniería Ciencias Físico Matemáticas</Link>
      </div>
    </div>
  );
};

export default Principal_Cuestionario;
