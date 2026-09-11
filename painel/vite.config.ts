import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

/** Em desenvolvimento o painel fala com a API publicada, para não precisar de base local. */
const API = process.env.API_PROXY_TARGET ?? "https://api-server-production-20c2.up.railway.app";

export default defineConfig({
  plugins: [react(), tailwind()],
  server: { proxy: { "/api": { target: API, changeOrigin: true } } },
});
