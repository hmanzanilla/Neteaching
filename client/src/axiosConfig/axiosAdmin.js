// client/src/axiosConfig/axiosAdmin.js
// Alias COMPATIBLE para no romper imports existentes:
//   import axiosAdmin from '../../axiosConfig/axiosAdmin'
export { httpAdminPrincipal as default } from "./http";

// (opcional) también re-exporta todo por si lo necesitas en algún punto:
export * from "./http";
