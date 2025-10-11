import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.txt'],
  server: {
    port: 3000,
    open: true
  }
});
