// src/components/Header.js
import React, { useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import Timer from "./Timer";
import "./Header.css";

const Header = () => {
  const { userData, logoutUser } = useContext(UserContext);

  useEffect(() => {
    console.log("🔍 [Header] Datos del usuario desde el contexto:", userData);
  }, [userData]);

  const handleLogout = async () => {
    try {
      await logoutUser(); // 👉 Cierra sesión, revoca token, limpia estado
      // window.location.replace("/login"); // 🔁 Redirección forzada para evitar errores si ya estás en /login
    } catch (error) {
      console.error("❌ Error al cerrar sesión desde Header:", error);
    }
  };

  return (
    <header>
      <div className="header-container">
        <img src="/favicon.ico" alt="favicon" className="favicon-img" />

        <div className="user-section">
          <p className="user-info">
            {userData?.firstName} {userData?.lastName} : En Neteaching pensamos en tu futuro!
          </p>
        </div>

        <div className="right-section">
          <Timer />
          <button className="logout-button" onClick={handleLogout}> 
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};
// si no jala seguimos usando el handleLogout
export default Header;