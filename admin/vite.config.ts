import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    strictPort: true, // Fail if port 3001 is taken instead of using another port
    cors: true,
  },
  base: '/',
  build: {
    target: 'esnext',
  },
});