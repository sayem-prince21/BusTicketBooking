import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The backend (Program.cs) does not configure CORS, and the backend must
    // never be modified. During development the Vite dev server therefore
    // proxies every /api request to the backend, which keeps the calls
    // same-origin from the browser's point of view.
    proxy: {
      '/api': {
        // Backend base URL (README: `dotnet run --launch-profile http` runs it
        // on http://localhost:5290). Change here if the backend moves — it is
        // the only place the backend address appears in the frontend.
        target: 'http://localhost:5290',
        changeOrigin: true,
      },
    },
  },
})
