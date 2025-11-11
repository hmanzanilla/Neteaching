// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Registro_Principal from './components/Registro_Principal';
import NotFound from './components/NotFound';

const App = () => (
  <Router>
    <Routes>
      <Route path="/*" element={<Registro_Principal />} /> {/* Todas las rutas son manejadas por Registro_Principal */}
      <Route path="*" element={<NotFound />} /> {/* Manejando rutas no encontradas */}
    </Routes>
  </Router>
);

export default App;
