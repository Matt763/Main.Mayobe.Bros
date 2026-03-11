import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/feed.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
