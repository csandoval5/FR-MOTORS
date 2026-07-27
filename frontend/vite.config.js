import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/FR-MOTORS/",   // 👈 clave para GitHub Pages
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
