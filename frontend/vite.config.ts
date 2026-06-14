import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `npm run dev`, proxy API calls to the local FastAPI backend so the
// frontend and backend share an origin just like they do in production.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    // Output is copied into backend/static at Docker image build time.
    outDir: "dist",
  },
});
