import { defineConfig } from 'vite';

export default defineConfig({
  base: '/keyboard_tale/',
  assetsInclude: ['**/*.txt'],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
