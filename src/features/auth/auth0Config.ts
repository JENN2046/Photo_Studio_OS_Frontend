export interface Auth0RuntimeConfig {
  audience: string;
  clientId: string;
  domain: string;
}

export function getAuth0RuntimeConfig(): Auth0RuntimeConfig | null {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN?.trim();
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID?.trim();
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE?.trim();

  if (!domain || !clientId || !audience) {
    return null;
  }

  return { audience, clientId, domain };
}
