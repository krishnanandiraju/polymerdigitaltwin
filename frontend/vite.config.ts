import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frontendPort = Number(env.VITE_PORT || 5173);
  const backendTarget =
    env.VITE_BACKEND_TARGET ||
    `http://localhost:${env.BACKEND_PORT || env.API_PORT || 8000}`;

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      // host: true binds to 0.0.0.0 — required for GitHub Codespaces port forwarding
      host: true,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
