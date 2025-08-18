import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    hmr: {
      clientPort: 443,
    },
  },
  
  // Use relative paths for better compatibility
  base: "./",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Ensure proper module format
        format: 'es'
      }
    }
  },
  
  // Ensure proper module resolution
  resolve: {
    alias: {
      'lit': 'lit',
      'lit/': 'lit/'
    }
  }
});