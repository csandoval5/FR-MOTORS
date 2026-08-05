import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 Agrega estas líneas
const repoName = 'FR-MOTORS' // Cambia esto por el nombre exacto de tu repo en GitHub

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`, // 👈 Esto es CRÍTICO para GitHub Pages
  server: {
    port: 5174, // Puerto fijo para evitar problemas de CORS
    strictPort: true // Falla si el puerto está ocupado
  }
})
