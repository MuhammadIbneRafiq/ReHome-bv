import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            // Whether to polyfill specific globals
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            // Whether to polyfill `global`
            protocolImports: true,
        }),
    ],
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
