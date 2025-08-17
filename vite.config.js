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
  // Remove the base path for now to fix the 404 issues
  // If you need it for GitHub Pages later, we can add it back
  // base: "./",
});
