// client/src/axiosConfig/http.js
import axios from "axios";

/**
 * Selecciona baseURL según:
 * - Variables de entorno (Vite/CRA)
 * - Producción (Render → backend real)
 * - Desarrollo local (localhost)
 */
function pickBaseURL({ viteKey, craKey, localhostFallback }) {
  // 1) Vite: import.meta.env
  const vite = typeof import.meta !== "undefined" ? import.meta.env?.[viteKey] : "";
  if (vite) return vite.replace(/\/+$/, "");

  // 2) CRA: process.env
  const cra = typeof process !== "undefined" ? process.env?.[craKey] : "";
  if (cra) return cra.replace(/\/+$/, "");

  // 3) Producción → frontend NO está en localhost
  //    Usar URL REAL del backend Render
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://neteaching.onrender.com";
  }

  // 4) Desarrollo local
  return localhostFallback.replace(/\/+$/, "");
}

/**
 * Crea instancia Axios robusta con:
 * - BaseURL dinámica
 * - Cookies habilitadas
 * - Manejo correcto de JSON/FormData
 */
export function createHttp(baseURL) {
  const http = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 20000,
    headers: { Accept: "application/json" },
  });

  // Detecta si el payload es FormData
  http.interceptors.request.use((config) => {
    const isForm =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isForm) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else if (!config.headers["Content-Type"] && !config.headers["content-type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  });

  return http;
}

/** 
 * Construye subrutas internas pero permitiendo baseURL vacío en producción 
 * (para usar reverse proxy si se requiere)
 */
function subBase(httpInstance, subpath) {
  const root = (httpInstance?.defaults?.baseURL || "").replace(/\/+$/, "");
  return root ? `${root}${subpath}` : subpath;
}

/* ========================================================
   █████  INSTANCIAS HTTP (PRINCIPAL + SUBSERVICIOS)  █████
   ======================================================== */

export const httpPrincipal = createHttp(
  pickBaseURL({
    viteKey: "VITE_API_URL_PRINCIPAL",
    craKey: "REACT_APP_API_URL_PRINCIPAL",
    localhostFallback: "http://localhost:3000",
  })
);

export const httpAlumno = createHttp(
  pickBaseURL({
    viteKey: "VITE_API_URL_ALUMNOS",
    craKey: "REACT_APP_API_URL_ALUMNOS",
    localhostFallback: "http://localhost:3001",
  })
);

export const httpMaestro = createHttp(
  pickBaseURL({
    viteKey: "VITE_API_URL_MAESTROS",
    craKey: "REACT_APP_API_URL_MAESTROS",
    localhostFallback: "http://localhost:3002",
  })
);

export const httpAdministrador = createHttp(
  pickBaseURL({
    viteKey: "VITE_API_URL_ADMINISTRADORES",
    craKey: "REACT_APP_API_URL_ADMINISTRADORES",
    localhostFallback: "http://localhost:3003",
  })
);

export const httpAdminPrincipal = createHttp(
  pickBaseURL({
    viteKey: "VITE_API_URL_ADMIN_PRINCIPAL",
    craKey: "REACT_APP_API_URL_ADMIN_PRINCIPAL",
    localhostFallback: "http://localhost:3004",
  })
);

/* ========================================================
   █████  INSTANCIAS AUTH POR ROL (API /auth)  █████
   ======================================================== */

export const httpAlumnoAuth = createHttp(
  subBase(httpAlumno, "/api/alumno/auth")
);

export const httpMaestroAuth = createHttp(
  subBase(httpMaestro, "/api/maestro/auth")
);

export const httpAdministradorAuth = createHttp(
  subBase(httpAdministrador, "/api/administrador/auth")
);

export const httpAdminPrincipalAuth = createHttp(
  subBase(httpAdminPrincipal, "/api/admin_principal/auth")
);

/** Alias legacy para no romper código viejo */
export const httpAdminAuth = httpAdministradorAuth;

