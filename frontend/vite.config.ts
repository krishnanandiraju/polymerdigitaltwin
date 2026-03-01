import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        // host: true binds to 0.0.0.0 — required for GitHub Codespaces port forwarding
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/ws': {
                target: 'http://localhost:8000',
                ws: true,
                changeOrigin: true
            }
        }
    }
})
