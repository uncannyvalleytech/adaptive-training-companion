import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    hmr: {
      clientPort: 443,
    },
    allowedHosts: ["wqz6c2-5174.csb.app"],
  },
  
  // CRITICAL FIX: Change this to match your actual repository name
  // If your GitHub repo URL is github.com/uncannyvalleytech/YOUR-REPO-NAME
  // then this should be "/YOUR-REPO-NAME/"
  // Based on the URL pattern, it should probably be:
  base: "./", // Use relative paths instead, which is more flexible
  // OR if you know the exact repo name:
  // base: "/adaptive-training-companion/",

  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});