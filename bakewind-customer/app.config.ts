import { defineConfig } from '@solidjs/start/config';

export default defineConfig({
  ssr: true,
  server: {
    preset: 'node-server',
    prerender: {
      routes: [
        '/', // Home page
        '/about', // About page
        '/contact', // Contact page
        '/privacy', // Privacy policy
        '/terms', // Terms of service
      ],
      crawlLinks: true, // Auto-discover routes
    },
  },
  vite: {
    optimizeDeps: {
      include: ['@solidjs/meta', '@solidjs/router'],
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    ssr: {
      noExternal: ['@solidjs/meta'],
    },
  },
  experimental: {
    islands: true, // Enable islands architecture for better performance
  },
  nitro: {
    compressPublicAssets: true,
    minify: true,
    prerender: {
      autoSubfolderIndex: false,
    },
  },
});