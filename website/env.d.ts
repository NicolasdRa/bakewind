/// <reference types="vinxi/types/client" />

interface ImportMetaEnv {
  DB_URL: string;
  SITE_NAME: string;
  SESSION_SECRET: string;
  VITE_API_URL: string;
  VITE_ADMIN_APP_URL: string;
}
  
interface ImportMeta {
  readonly env: ImportMetaEnv
}
