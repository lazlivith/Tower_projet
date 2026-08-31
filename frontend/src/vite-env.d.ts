/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de base de l'API backend, ex: http://localhost:5000/api */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
