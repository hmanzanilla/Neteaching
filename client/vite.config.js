//Neteaching/client/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración para el frontend con React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // permite acceso desde Docker o red local
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    watch: {
      usePolling: true // importante en Windows o Docker
    }
  },
  build: {
    sourcemap: true,
    emptyOutDir: true
  }
})
