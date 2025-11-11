// src/context/UserContext.js
import React, { createContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import axiosAlumno from "../axiosConfig/axiosAlumno";
import axiosMaestro from "../axiosConfig/axiosMaestros";
import axiosAdministrador from "../axiosConfig/axiosAdministrador";
import axiosAdmin from "../axiosConfig/axiosAdmin";
import axiosPrincipal from "../axiosConfig/axiosPrincipal";

console.log(" UserContext cargado correctamente");

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const getAxiosByRole = (role) => {
    switch (role) {
      case "alumno":
        return axiosAlumno;
      case "maestro":
        return axiosMaestro;
      case "administrador":
        return axiosAdministrador;
      case "admin_principal":
        return axiosAdmin;
      default:
        console.error("❌ Rol no reconocido o no definido:", role);
        return null;
    }
  };

  const marcarEstadoConectado = async (role) => {
    if (!role) return;
    const axiosInstance = getAxiosByRole(role);
    if (!axiosInstance) return;

    try {
      await axiosInstance.post("/marcar-conectado", {}, { withCredentials: true });
      console.log("🟢 Estado actualizado a 'conectado'");
    } catch (error) {
      console.warn(
        "⚠ No se pudo marcar estado como conectado:",
        error.response?.data?.message || error.message
      );
    }
  };

  const checkSession = async () => {
    try {
      const res = await axiosPrincipal.get("/verify-token", { withCredentials: true });

      if (res.data?.user?.role) {
        console.log("✅ Sesión activa detectada:", res.data);
        setUserData(res.data.user);
        setIsAuthenticated(true);
        await marcarEstadoConectado(res.data.user.role);
      } else {
        resetUserState();
      }
    } catch (error) {
      console.warn("❌ No hay sesión activa:", error.response?.data?.message || error.message);
      resetUserState();
    } finally {
      setLoading(false);
    }
  };

  const loginUser = (userObject, role) => {
    if (!userObject || !role) return;
    console.log(`🔑 Login como ${role}, sesión iniciada`);
    setUserData({ ...userObject, role });
    setIsAuthenticated(true);
    localStorage.setItem("rol_backup", role);
    marcarEstadoConectado(role);
  };

  // ✅ Logout SIEMPRE al servidor principal
  const logoutUser = async () => {
    try {
      console.log("🔐 Logout (principal):", axiosPrincipal?.defaults?.baseURL);
      await axiosPrincipal.post("/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error?.response?.status || error?.message);
    } finally {
      resetUserState();
      console.log("🔁 Redirigiendo forzadamente a /login");
      window.location.replace("/login");
    }
  };

  const resetUserState = () => {
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem("rol_backup");
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    console.log("📍 Cambio de ruta:", location.pathname);
  }, [location.pathname]);

  // ✅ Cierre de pestaña → primero sendBeacon; si falla, fetch keepalive + credentials
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isAuthenticated) return;

      const url = `${axiosPrincipal.defaults.baseURL.replace(/\/+$/, "")}/logout`;
      const body = JSON.stringify({ via: "beforeunload" });

      // 1) Intentar sendBeacon (rápido y no bloquea)
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          const ok = navigator.sendBeacon(url, blob);
          if (ok) {
            console.log("🔒 Logout enviado por sendBeacon:", url);
            return; // listo
          }
        }
      } catch (e) {
        // seguimos al fallback
      }

      // 2) Fallback: fetch con keepalive y cookies incluidas
      try {
        fetch(url, {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          keepalive: true,
        }).catch(() => {});
        console.log("🔒 Logout enviado por fetch keepalive:", url);
      } catch (err) {
        // silencioso; en el peor caso el backend no alcanzará a recibirlo
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAuthenticated]);

  return (
    <UserContext.Provider
      value={{
        userData,
        setUserData,
        isAuthenticated,
        loading,
        loginUser,
        logoutUser,
        setLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;