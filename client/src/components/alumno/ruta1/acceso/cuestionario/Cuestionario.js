// client/src/components/alumno/ruta1/acceso/cuestionario/Cuestionario.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import MenuCuestionarios from "./MenuCuestionarios";

// IPN
import IPN_MedicoBiologicas from "./ipn/MedicoBiologicas";
import IPN_SocialesAdministrativas from "./ipn/SocialesAdministrativas";
import IPN_Ingenieria from "./ipn/Ingenieria";
import IPN_Retro from "./ipn/Retroalimentacion"; // 👈 NUEVO

// UNAM
import UNAM_MedicoBiologicas from "./unam/MedicoBiologicas";
import UNAM_SocialesAdministrativas from "./unam/SocialesAdministrativas";
import UNAM_Ingenieria from "./unam/Ingenieria";

// UAM
import UAM_MedicoBiologicas from "./uam/MedicoBiologicas";
import UAM_SocialesAdministrativas from "./uam/SocialesAdministrativas";
import UAM_Ingenieria from "./uam/Ingenieria";

const Cuestionario = () => {
  return (
    <Routes>
      <Route path="/" element={<MenuCuestionarios />} />

      {/* IPN */}
      <Route path="ipn/medico-biologicas" element={<IPN_MedicoBiologicas />} />
      <Route path="ipn/sociales-administrativas" element={<IPN_SocialesAdministrativas />} />
      <Route path="ipn/ingenieria" element={<IPN_Ingenieria />} />
      <Route path="ipn/retro/:rfId" element={<IPN_Retro />} /> {/* 👈 NUEVA RUTA */}

      {/* UNAM */}
      <Route path="unam/medico-biologicas" element={<UNAM_MedicoBiologicas />} />
      <Route path="unam/sociales-administrativas" element={<UNAM_SocialesAdministrativas />} />
      <Route path="unam/ingenieria" element={<UNAM_Ingenieria />} />

      {/* UAM */}
      <Route path="uam/medico-biologicas" element={<UAM_MedicoBiologicas />} />
      <Route path="uam/sociales-administrativas" element={<UAM_SocialesAdministrativas />} />
      <Route path="uam/ingenieria" element={<UAM_Ingenieria />} />
    </Routes>
  );
};

export default Cuestionario;
