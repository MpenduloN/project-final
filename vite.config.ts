import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { AuthProvider, useAuth } from "./contexts/AuthContext";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
