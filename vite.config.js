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
    // This is the new part that fixes the "Blocked request" error.
    // It tells Vite to trust the preview window's address.
    allowedHosts: ["wqz6c2-5173.csb.app"],
  },
});
