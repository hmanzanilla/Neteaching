// src/context/UserContext.js
import React, { createContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import axiosAlumno from "../axiosConfig/axiosAlumno";
import axiosMaestro from "../axiosConfig/axiosMaestros";
import axiosAdministrador from "../axiosConfig/axiosAdministrador";
import axiosAdmin from "../axiosConfig/axiosAdmin";              // admin_principal
import axiosPrincipal from "../axiosConfig/axiosPrincipal";      // servidor principal

console.log("UserContext cargado correctamente");

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     HELPERS
     ============================================================ */

  const roleFromPath = (pathname) => {
    if (!pathname) return null;
    if (pathname.startsWith("/alumno")) return "alumno";
    if (pathname.startsWith("/maestro")) return "maestro";
    if (pathname.startsWith("/administrador")) return "administrador";
    if (pathname.startsWith("/adminprincipal")) return "admin_principal";
    return null;
  };

  const roleFromCookie = () => {
    const cookie = document.cookie;

    if (cookie.includes("token_alumno")) return "alumno";
    if (cookie.includes("token_maestro")) return "maestro";
    if (cookie.includes("token_administrador")) return "administrador";
    if (cookie.includes("token_admin_principal")) return "admin_principal";

    return null;
  };

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
        console.error("❌ getAxiosByRole: rol desconocido:", role);
        return null;
    }
  };

  /* ============================================================
     MARCAR ESTADO CONECTADO
     ============================================================ */

  const marcarEstadoConectado = async (role) => {
    if (!role) return;

    const ax = getAxiosByRole(role);
    if (!ax) return;

    const prefix = role === "admin_principal" ? "admin_principal" : role;
    const endpoint = `/api/${prefix}/marcar-conectado`;

    try {
      console.log(`📡 Marcar conectado → ${ax.defaults.baseURL}${endpoint}`);
      await ax.post(endpoint, {}, { withCredentials: true });
      console.log("🟢 Estado de conexión actualizado.");
    } catch (err) {
      console.error("❌ Error marcando conectado:", err.response?.data || err.message);
    }
  };

  /* ============================================================
     VERIFICACIÓN GLOBAL / VERIFY TOKEN SIN ROMPER NADA
     ============================================================ */

  const checkSessionPrincipal = async () => {
    try {
      const role = roleFromCookie();
      if (!role) throw new Error("No se detecta cookie de sesión.");

      const ax = getAxiosByRole(role);
      if (!ax) throw new Error("Rol sin axios asignado.");

      const prefix = role === "admin_principal" ? "admin_principal" : role;

      const res = await ax.get(`/api/${prefix}/verify-token`, {
        withCredentials: true,
      });

      console.log("✅ Sesión activa encontrada:", res.data);

      setUserData({ ...res.data, role });
      setIsAuthenticated(true);

      await marcarEstadoConectado(role);

    } catch (err) {
      console.warn("❌ Sesión no activa:", err.response?.data || err.message);
      resetUserState();
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOGIN
     ============================================================ */

  const loginUser = async (userObject, role) => {
    if (!userObject || !role) return;

    setUserData({ ...userObject, role });
    setIsAuthenticated(true);

    localStorage.setItem("rol_backup", role);

    await marcarEstadoConectado(role);
  };

  /* ============================================================
     LOGOUT
     ============================================================ */

  const resetUserState = () => {
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem("rol_backup");
  };

  const logoutUser = async () => {
    const role =
      userData?.role || localStorage.getItem("rol_backup") || roleFromCookie();

    try {
      await axiosPrincipal.post("/auth/logout", {}, { withCredentials: true });
    } catch {}

    try {
      const ax = getAxiosByRole(role);
      if (ax) {
        const prefix = role === "admin_principal" ? "admin_principal" : role;
        await ax.post(`/api/${prefix}/auth/logout`, {}, { withCredentials: true });
      }
    } catch {}

    resetUserState();
    window.location.replace("/login");
  };

  /* ============================================================
     USE EFFECTS
     ============================================================ */

  useEffect(() => {
    const r = roleFromPath(location.pathname);

    if (r) {
      console.log(`⏭ Ruta de rol detectada (${r}), el subservidor maneja la sesión.`);
      setLoading(false);
      return;
    }

    checkSessionPrincipal();
  }, []);

  useEffect(() => {
    console.log("📍 Cambio de ruta:", location.pathname);
  }, [location.pathname]);

  /* ============================================================
     BEFOREUNLOAD LOGOUT
     ============================================================ */

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isAuthenticated) return;

      const role =
        userData?.role ||
        localStorage.getItem("rol_backup") ||
        roleFromCookie() ||
        "";

      const prefix = role === "admin_principal" ? "admin_principal" : role;

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `${axiosPrincipal.defaults.baseURL}/auth/logout`,
            new Blob([JSON.stringify({ via: "beforeunload" })], {
              type: "application/json",
            })
          );
        }
      } catch {}

      try {
        const ax = getAxiosByRole(role);
        if (ax) {
          fetch(`${ax.defaults.baseURL}/api/${prefix}/auth/logout`, {
            method: "POST",
            credentials: "include",
            keepalive: true,
          });
        }
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAuthenticated, userData?.role]);

  /* ============================================================
     RETURN
     ============================================================ */

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



