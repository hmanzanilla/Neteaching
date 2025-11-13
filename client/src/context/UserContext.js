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

  /* ---------- helpers ---------- */

  const roleFromPath = (pathname) => {
    if (!pathname) return null;
    if (pathname.startsWith("/alumno")) return "alumno";
    if (pathname.startsWith("/maestro")) return "maestro";
    if (pathname.startsWith("/administrador")) return "administrador";
    if (pathname.startsWith("/adminprincipal")) return "admin_principal";
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
        console.error("❌ Rol no reconocido o no definido:", role);
        return null;
    }
  };

  /* ---------- marcar conectado ---------- */

  const marcarEstadoConectado = async (role) => {
    if (!role) return;

    const axiosInstance = getAxiosByRole(role);
    if (!axiosInstance) return;

    const rolePrefix = role === "admin_principal" ? "admin_principal" : role;
    const endpoint = `/api/${rolePrefix}/marcar-conectado`;

    try {
      const base = axiosInstance.defaults.baseURL || "";
      console.log(`📡 Marcar conectado → ${base}${endpoint}`);
      await axiosInstance.post(endpoint, {}, { withCredentials: true });
      console.log("🟢 Estado actualizado correctamente");
    } catch (err) {
      console.error(
        `❌ Falló marcar conectado (${role}):`,
        err.response?.status,
        err.response?.data || err.message
      );
    }
  };

  /* ---------- verificación de sesión ---------- */

  const checkSessionPrincipal = async () => {
    try {
      const res = await axiosPrincipal.get("/auth/verify-token", {
        withCredentials: true,
      });

      const payload = res?.data?.user || null;

      if (payload?.role) {
        console.log("✅ Sesión activa detectada:", payload);
        setUserData(payload);
        setIsAuthenticated(true);

        await marcarEstadoConectado(payload.role);
      } else {
        resetUserState();
      }
    } catch (error) {
      console.warn(
        "❌ No hay sesión activa:",
        error?.response?.data?.message || error?.message
      );
      resetUserState();
    } finally {
      setLoading(false);
    }
  };

  /* ---------- login ---------- */

  const loginUser = async (userObject, role) => {
    if (!userObject || !role) return;

    console.log(`🔑 Login como ${role}, sesión iniciada`);
    setUserData({ ...userObject, role });
    setIsAuthenticated(true);

    localStorage.setItem("rol_backup", role);

    await marcarEstadoConectado(role);
  };

  const resetUserState = () => {
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem("rol_backup");
  };

  /* ---------- logout ---------- */

  const logoutUser = async () => {
    const role = userData?.role || localStorage.getItem("rol_backup");

    // principal
    try {
      await axiosPrincipal.post("/auth/logout", {}, { withCredentials: true });
    } catch (e) {
      console.error("❌ Error al cerrar sesión en principal:", e.message);
    }

    // subservidor (best effort)
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

  /* ---------- efectos ---------- */

  useEffect(() => {
    const r = roleFromPath(location.pathname);
    if (r) {
      console.log(`⏭ Omitiendo verificación global en ruta de rol: ${r}`);
      setLoading(false);
      return;
    }
    checkSessionPrincipal();
  }, []);

  useEffect(() => {
    console.log("📍 Cambio de ruta:", location.pathname);
  }, [location.pathname]);

  /* ---------- beforeunload ---------- */

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isAuthenticated) return;

      const role = userData?.role || localStorage.getItem("rol_backup") || "";
      const principalURL = `${axiosPrincipal.defaults.baseURL}/auth/logout`;

      const body = JSON.stringify({ via: "beforeunload" });

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            principalURL,
            new Blob([body], { type: "application/json" })
          );
        }
      } catch {}

      try {
        const ax = getAxiosByRole(role);
        if (ax) {
          const prefix = role === "admin_principal" ? "admin_principal" : role;
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

