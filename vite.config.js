import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'FR-MOTORS'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? `/${repoName}/` : '/',
  server: {
    port: 5174,
    strictPort: true
  }
}))