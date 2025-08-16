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
  // We're adding a base path for the deployment to GitHub Pages.
  // This is critical for ensuring that the app's assets (like CSS and JS)
  // are loaded correctly from the sub-folder where GitHub Pages will host it.
  base: "./",
});
