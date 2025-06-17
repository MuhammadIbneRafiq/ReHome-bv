import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    root: './src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://rehome-backend.vercel.app',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api/, '/api')
            }
        }
    }
}); 