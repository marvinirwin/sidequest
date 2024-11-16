import { defineConfig } from 'vite'
// ... other imports ...

export default defineConfig({
  // ... other config options ...
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Optionally remove '/api' prefix when forwarding to the target
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      // If you want to proxy all requests to port 3000
      '/': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
}) 