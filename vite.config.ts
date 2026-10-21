import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  // No GitHub Pages o site fica em /<repo>/; o workflow define VITE_BASE
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      port: 5173
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})
