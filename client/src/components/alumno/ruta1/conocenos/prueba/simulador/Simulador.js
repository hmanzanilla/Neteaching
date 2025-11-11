// acceso/aula_virtual/Principal_Aula_Vitual.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrincipalAulaVirtual = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Aula Virtual</h2>
      <p>El Aula Virtual estará disponible próximamente. Estamos trabajando en ello.</p>
      <button onClick={() => navigate('/acceso')}>Regresar al Menú Principal</button>
    </div>
  );
};

export default PrincipalAulaVirtual;
