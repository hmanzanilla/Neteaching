// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { UserProvider } from './context/UserContext';

const container = document.getElementById('root');

if (!container) {
  console.error("No se encontró el elemento con id 'root' en el HTML.");
} else {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <Router>  {/* 🔥 Ahora el Router envuelve todo */}
        <UserProvider>
          <App />
        </UserProvider>
      </Router>
    </React.StrictMode>
  );

  if (process.env.NODE_ENV !== 'production') {
    import('./reportWebVitals')
      .then(({ default: reportWebVitals }) => {
        reportWebVitals(console.log);
      })
      .catch(err => console.error('Error al cargar reportWebVitals:', err));
  }
}
