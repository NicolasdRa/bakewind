/// <reference types="vinxi/types/client" />

interface ImportMetaEnv {
  DB_URL: string;
  SITE_NAME: string;
  SESSION_SECRET: string;
}
  
interface ImportMeta {
  readonly env: ImportMetaEnv
}
