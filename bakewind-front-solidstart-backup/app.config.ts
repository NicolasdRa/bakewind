import { defineConfig } from "@solidjs/start/config";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    preset: "node-server"
  },
  vite: {
    plugins: [tailwindcss()], 
    // TODO: replace with ???
    // ssr: { external: ["drizzle-orm", "better-sqlite3"] }
  }
});
