//ruta4/bimestreActual/bimestreActual.js
// client/src/components/adminprincipal/ruta4/bimestreActual/bimestreActual.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './bimestreActual.css';

const BimestreActual = () => {
  const [bimestre, setBimestre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const opciones = ['Primer Bimestre', 'Segundo Bimestre', 'Tercer Bimestre'];

  // 🔹 GET con credenciales (para evitar el 401)
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/bimestre-actual`, {
      withCredentials: true
    })
    .then(res => {
      if (res.data && res.data.bimestre) {
        setBimestre(res.data.bimestre);
      }
    })
    .catch(err => {
      console.error("❌ Error al obtener el bimestre actual:", err);
    });
  }, []);

  const actualizarBimestre = () => {
    axios.post(
      `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/bimestre-actual`,
      { bimestre },
      { withCredentials: true }
    )
    .then(() => {
      setMensaje('✅ Bimestre actualizado correctamente.');
      setTimeout(() => setMensaje(''), 3000);
    })
    .catch(err => {
      console.error("❌ Error al actualizar el bimestre:", err);
      setMensaje('❌ Error al guardar el bimestre.');
    });
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Seleccionar Bimestre Actual</h2>

      <select
        value={bimestre}
        onChange={e => setBimestre(e.target.value)}
        style={{ fontSize: '16px', padding: '8px', margin: '10px' }}
      >
        <option value="">-- Selecciona un bimestre --</option>
        {opciones.map(op => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>

      <br />
      <button
        onClick={actualizarBimestre}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Guardar Bimestre
      </button>

      {mensaje && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{mensaje}</p>}
    </div>
  );
};

export default BimestreActual;
