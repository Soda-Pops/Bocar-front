import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@app': '/src/app',
      '@features': '/src/features',
      '@pages': '/src/pages',
      '@layouts': '/src/layouts',
      '@shared': '/src/shared',
    },
  },
});
