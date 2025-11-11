// src/context/UserContext.js
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

  const marcarEstadoConectado = async (role) => {
    if (!role) return;
    const axiosInstance = getAxiosByRole(role);
    if (!axiosInstance) return;

    // Prefijo correcto para cada rol
    const rolePrefix = role === "admin_principal" ? "admin_principal" : role;

    // 1) Intento principal: ruta con prefijo de rol
    const primaryPath = `/api/${rolePrefix}/marcar-conectado`;
    // 2) Fallback: alias plano retrocompatible
    const fallbackPath = `/marcar-conectado`;

    const base = (axiosInstance?.defaults?.baseURL || "").replace(/\/+$/, "");
    try {
      console.log(`📡 Marcar conectado (try #1) → ${base}${primaryPath} (rol=${role})`);
      await axiosInstance.post(primaryPath, {}, { withCredentials: true });
      console.log("🟢 Estado actualizado a 'conectado' (ruta namespaced)");
    } catch (err1) {
      const msg1 = err1?.response?.data?.message || err1?.message || "Error desconocido";
      console.warn(`⚠ Falló ruta namespaced [${err1?.response?.status || "?"}]: ${msg1}`);

      try {
        console.log(`📡 Marcar conectado (try #2) → ${base}${fallbackPath} (rol=${role})`);
        await axiosInstance.post(fallbackPath, {}, { withCredentials: true });
        console.log("🟢 Estado actualizado a 'conectado' (alias plano)");
      } catch (err2) {
        const msg2 = err2?.response?.data?.message || err2?.message || "Error desconocido";
        console.warn(`❌ No se pudo marcar estado (ambas rutas fallaron) [${err2?.response?.status || "?"}]: ${msg2}`);
      }
    }
  };

  /* ---------- verificación de sesión ---------- */

  // Verificación global contra el servidor principal (acepta cualquier rol si llega la cookie)
  const checkSessionPrincipal = async () => {
    try {
      const res = await axiosPrincipal.get("/verify-token", { withCredentials: true });
      const payload = res?.data?.user || res?.data || null;

      if (payload?.role) {
        console.log("✅ Sesión activa detectada:", payload);
        setUserData(payload);
        setIsAuthenticated(true);
        await marcarEstadoConectado(payload.role);
      } else {
        resetUserState();
      }
    } catch (error) {
      console.warn("❌ No hay sesión activa:", error?.response?.data?.message || error?.message);
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

  const resetUserState = () => {
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem("rol_backup");
  };

  /* ---------- logout ---------- */

  // Intenta cerrar sesión en principal y también en el subservidor del rol
  const logoutUser = async () => {
    const role = userData?.role || localStorage.getItem("rol_backup");

    // 1) principal
    try {
      console.log("🔐 Logout (principal):", axiosPrincipal?.defaults?.baseURL);
      await axiosPrincipal.post("/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("❌ Error al cerrar sesión (principal):", error?.response?.status || error?.message);
    }

    // 2) subservidor por rol (mejor esfuerzo)
    try {
      const ax = getAxiosByRole(role);
      if (ax) {
        const base = (ax.defaults?.baseURL || "").replace(/\/+$/, "");
        // todas tus rutas auth siguen el patrón /api/{rol}/auth/logout en los subservidores
        const url = `${base}/api/${role === "admin_principal" ? "admin_principal" : role}/auth/logout`;
        await fetch(url, { method: "POST", credentials: "include" });
      }
    } catch {
      /* silencioso */
    }

    resetUserState();
    console.log("🔁 Redirigiendo forzadamente a /login");
    window.location.replace("/login");
  };

  /* ---------- efectos ---------- */

  // Montaje: si estamos en rutas públicas o “raíz”, verifica con el PRINCIPAL.
  // Si estamos dentro de un módulo por rol (/maestro, /alumno, /administrador, /adminprincipal)
  // NO verificamos aquí: cada módulo hace su propia verificación contra su subservidor.
  useEffect(() => {
    const r = roleFromPath(location.pathname);
    if (r) {
      console.log(`🛑 UserContext: omito verificación global en ruta de rol: ${r}`);
      setLoading(false); // dejamos que el módulo maneje su loader
      return;
    }
    checkSessionPrincipal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // sólo al montar

  useEffect(() => {
    console.log("📍 Cambio de ruta:", location.pathname);
  }, [location.pathname]);

  // Cierre de pestaña → logout best-effort (principal + por rol si se conoce)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isAuthenticated) return;

      const role = userData?.role || localStorage.getItem("rol_backup") || "";
      const principalURL = `${(axiosPrincipal.defaults.baseURL || "").replace(/\/+$/, "")}/logout`;
      const body = JSON.stringify({ via: "beforeunload" });

      // principal por sendBeacon
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon(principalURL, blob);
        }
      } catch {}

      // subservidor por rol (keepalive)
      try {
        const ax = getAxiosByRole(role);
        if (ax) {
          const base = (ax.defaults?.baseURL || "").replace(/\/+$/, "");
          const url = `${base}/api/${role === "admin_principal" ? "admin_principal" : role}/auth/logout`;
          fetch(url, { method: "POST", credentials: "include", keepalive: true }).catch(() => {});
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
