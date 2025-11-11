// 📁 src/components/alumno/ruta1/acceso/perfil/perfil.js
import React, { useContext } from 'react';
import SubirFoto from './SubirFoto';
import { UserContext } from '../../../../../context/UserContext';

const Perfil = () => {
  const { userData } = useContext(UserContext);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Mi Perfil</h2>
      {userData ? <SubirFoto /> : <p>Cargando información del usuario...</p>}
    </div>
  );
};

export default Perfil;

