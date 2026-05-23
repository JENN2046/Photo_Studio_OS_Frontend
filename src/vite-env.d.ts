/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_API_BASE_URL?: string;
  readonly VITE_BACKEND_USER_ROLE?: string;
  readonly VITE_BACKEND_USER_NAME?: string;
  readonly VITE_AUTH0_AUDIENCE?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  readonly VITE_AUTH0_DOMAIN?: string;
}
