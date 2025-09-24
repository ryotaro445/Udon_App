// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      // フロントからの /api をバックエンド(Uvicorn)へ
      '/api': 'http://127.0.0.1:8000',
    },
  },
  optimizeDeps: {
    // d3-time が解決されず Vite が落ちる問題を未然に防ぐ
    include: ['recharts', 'd3-time', 'd3-time-format', 'd3-scale', 'd3-shape'],
  },
});