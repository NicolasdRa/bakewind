import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss()
  ],
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