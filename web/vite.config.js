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
  // Change this to "/" if deploying to a custom domain
  base: "/./",

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
        },
        // Ensure consistent file naming
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    // Ensure compatibility with older browsers
    target: 'es2020',
    // Minify for production
    minify: 'esbuild'
  },

  optimizeDeps: {
    include: ['lit'],
    // Handle ESM dependencies
    force: true,
    // Ensure proper handling of external dependencies
    esbuildOptions: {
      target: 'es2020'
    }
  },

  // Add define to handle any missing environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'globalThis'
  },

  // Enhanced error handling for module resolution
  resolve: {
    alias: {
      // Add any aliases if needed in the future
    },
    // Ensure proper resolution of ES modules
    dedupe: ['lit']
  },

  // CORS and security configuration
  preview: {
    port: 4173,
    host: true,
    cors: true,
    // Serve index.html for all routes (SPA)
    strictPort: false
  },

  // Plugin configuration (empty for now, but ready for future plugins)
  plugins: [],

  // Enhanced CSS handling
  css: {
    devSourcemap: true,
    // PostCSS configuration if needed
    postcss: {},
    // CSS modules configuration
    modules: false
  },

  // Worker handling for service workers
  worker: {
    format: 'es',
    plugins: []
  },

  // Enhanced esbuild configuration
  esbuild: {
    target: 'es2020',
    // Keep console logs in development
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    // Preserve function names for better debugging
    keepNames: true
  },

  // JSON handling
  json: {
    namedExports: true,
    stringify: false
  },

  // Environment variables configuration
  envPrefix: 'VITE_',

  // Dependency pre-bundling
  cacheDir: 'node_modules/.vite',

  // Logging level
  logLevel: 'info',

  // Clear screen on rebuild
  clearScreen: true
});
