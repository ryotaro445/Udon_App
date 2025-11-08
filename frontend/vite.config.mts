// frontend/vite.config.mts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    // 使っていないなら proxy はあっても害なし（VITE_API_BASE で直叩きでもOK）
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  optimizeDeps: {
    // ★これが重要：依存スキャンの“起点”を index.html / main.tsx に限定
    entries: ["index.html", "src/main.tsx"],
    include: ["react", "react-dom", "react-router-dom", "recharts", "d3-time", "d3-time-format", "d3-scale", "d3-shape"],
  },
  // 念のため（開発には不要だが安定化に寄与）
  base: "/",
});