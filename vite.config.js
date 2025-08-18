import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // This configuration ensures that the development server
  // works correctly within the CodeSandbox environment.
  server: {
    host: "0.0.0.0",
    hmr: {
      clientPort: 443,
    },
    // This is the updated part that fixes the new "Blocked request" error.
    // It tells Vite to trust the NEW preview window's address.
    allowedHosts: ["wqz6c2-5174.csb.app"],
  },
  
  // Critical for GitHub Pages deployment
  // This tells Vite that your app will be served from /adaptive-training-companion/
  base: "/adaptive-training-companion/",

  // Build configuration for GitHub Pages
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Ensure proper asset handling
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },

  // Ensure proper handling of ES modules
  optimizeDeps: {
    include: ['lit']
  }
});
