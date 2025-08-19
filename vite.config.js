import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5174,
    hmr: {
      clientPort: 443,
    },
  },
  
  // Set the correct base path for GitHub Pages
  base: "/adaptive-training-companion/",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          // Split vendor code into separate chunks for better caching
          vendor: ['lit'],
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true
  },

  optimizeDeps: {
    include: ['lit'],
    // Handle ESM dependencies
    force: true
  },

  // Add define to handle any missing environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_
