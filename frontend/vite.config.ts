import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // O navegador chama sempre /api (relativo); o Vite repassa ao NestJS.
    // Assim não há URL absoluta no código do cliente nem necessidade de CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
