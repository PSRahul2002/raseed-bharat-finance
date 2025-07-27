import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    headers: {
      // Configure Cross-Origin-Opener-Policy for Google Sign-In
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      // Proxy API requests to avoid CORS issues
      '/api/process-receipt': {
        target: 'https://receipt-categorization-593566622908.us-central1.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/process-receipt/, '/process-receipt'),
        secure: true,
      },
      // Proxy for bill submission API
      '/api/store-receipt': {
        target: process.env.VITE_API_BASE_URL || 'https://receipt-storage-api-593566622908.us-central1.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/store-receipt/, '/store-receipt'),
        secure: true, // Set to true for HTTPS
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
