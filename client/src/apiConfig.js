// client/src/apiConfig.js

// Define la URL base del backend (Render o localhost)
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

// Helper general para peticiones seguras (opcional)
export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error ${response.status}: ${text}`);
  }
  return response.json();
}
