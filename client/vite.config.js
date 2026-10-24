import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app calls the Express server directly using VITE_API_URL (see src/api/client.js).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173 },
});
