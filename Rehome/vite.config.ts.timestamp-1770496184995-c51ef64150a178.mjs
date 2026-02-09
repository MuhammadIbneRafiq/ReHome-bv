// vite.config.ts
import { defineConfig } from "file:///C:/Users/wifi%20stuff/OneDrive%20-%20TU%20Eindhoven/Documents/ReHome-bv/Rehome/node_modules/vite/dist/node/index.js";
import path from "path";
import react from "file:///C:/Users/wifi%20stuff/OneDrive%20-%20TU%20Eindhoven/Documents/ReHome-bv/Rehome/node_modules/@vitejs/plugin-react/dist/index.js";
import { nodePolyfills } from "file:///C:/Users/wifi%20stuff/OneDrive%20-%20TU%20Eindhoven/Documents/ReHome-bv/Rehome/node_modules/vite-plugin-node-polyfills/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\wifi stuff\\OneDrive - TU Eindhoven\\Documents\\ReHome-bv\\Rehome";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill specific globals
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      // Whether to polyfill `global`
      protocolImports: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "https://rehome-backend.vercel.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path2) => path2.replace(/^\/api/, "/api")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx3aWZpIHN0dWZmXFxcXE9uZURyaXZlIC0gVFUgRWluZGhvdmVuXFxcXERvY3VtZW50c1xcXFxSZUhvbWUtYnZcXFxcUmVob21lXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx3aWZpIHN0dWZmXFxcXE9uZURyaXZlIC0gVFUgRWluZGhvdmVuXFxcXERvY3VtZW50c1xcXFxSZUhvbWUtYnZcXFxcUmVob21lXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy93aWZpJTIwc3R1ZmYvT25lRHJpdmUlMjAtJTIwVFUlMjBFaW5kaG92ZW4vRG9jdW1lbnRzL1JlSG9tZS1idi9SZWhvbWUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscyc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgbm9kZVBvbHlmaWxscyh7XG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRvIHBvbHlmaWxsIHNwZWNpZmljIGdsb2JhbHNcbiAgICAgICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICAgICAgICBCdWZmZXI6IHRydWUsXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiB0cnVlLFxuICAgICAgICAgICAgICAgIHByb2Nlc3M6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgZ2xvYmFsYFxuICAgICAgICAgICAgcHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIHByb3h5OiB7XG4gICAgICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwczovL3JlaG9tZS1iYWNrZW5kLnZlcmNlbC5hcHAnLFxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcvYXBpJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwWixTQUFTLG9CQUFvQjtBQUN2YixPQUFPLFVBQVU7QUFDakIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBSDlCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFNBQVM7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQTtBQUFBLE1BRVYsU0FBUztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLE1BQ2I7QUFBQTtBQUFBLE1BRUEsaUJBQWlCO0FBQUEsSUFDckIsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN4QztBQUFBLEVBQ0o7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNKLE9BQU87QUFBQSxNQUNILFFBQVE7QUFBQSxRQUNKLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFVBQVUsTUFBTTtBQUFBLE1BQ3BEO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIl0KfQo=
