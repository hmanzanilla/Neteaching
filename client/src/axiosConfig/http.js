// client/src/axiosConfig/http.js
// client/src/axiosConfig/http.js
import axios from "axios";

/** Selecciona baseURL según env (Vite/CRA), prod (mismo dominio) o dev (localhost) */
function pickBaseURL({ viteKey, craKey, localhostFallback }) {
  const vite = typeof import.meta !== "undefined" ? import.meta.env?.[viteKey] : "";
  if (vite) return vite.replace(/\/+$/, "");

  const cra = typeof process !== "undefined" ? process.env?.[craKey] : "";
  if (cra) return cra.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    // prod con reverse proxy: usa rutas relativas (/api/...)
    return "";
  }
  return localhostFallback.replace(/\/+$/, "");
}

/** Crea instancia Axios robusta (JSON/FormData + credenciales + timeout) */
export function createHttp(baseURL) {
  const http = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 20000,
    headers: { Accept: "application/json" },
  });

  // Manejo correcto de JSON/FormData
  http.interceptors.request.use((config) => {
    const isForm = typeof FormData !== "undefined" && config.data instanceof FormData;
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

/** Construye base para subrutas respetando baseURL relativo/vacío */
function subBase(httpInstance, subpath) {
  const root = (httpInstance?.defaults?.baseURL || "").replace(/\/+$/, "");
  // Si baseURL está vacío (proxy en prod), devuelve ruta relativa
  return root ? `${root}${subpath}` : subpath;
}

/* ===== Instancias por subservidor ===== */
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

/* ===== Instancias específicas (AUTH por rol) ===== */
export const httpAlumnoAuth         = createHttp(subBase(httpAlumno,          "/api/alumno/auth"));
export const httpMaestroAuth        = createHttp(subBase(httpMaestro,         "/api/maestro/auth"));
export const httpAdministradorAuth  = createHttp(subBase(httpAdministrador,   "/api/administrador/auth"));
export const httpAdminPrincipalAuth = createHttp(subBase(httpAdminPrincipal,  "/api/admin_principal/auth"));

/* ===== Aliases de compatibilidad (evitan tocar muchos imports existentes) ===== */
// Algunos componentes están importando httpAdminAuth: exponlo como alias del admin común.
export const httpAdminAuth = httpAdministradorAuth;
