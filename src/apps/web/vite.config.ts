import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so the build works under /AriadneNSD/app/ on GitHub Pages (DR-0013).
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
