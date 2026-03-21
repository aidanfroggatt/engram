export interface Env {
  B2_KEY_ID: string;
  B2_APP_KEY: string;
  B2_ENDPOINT: string;
  B2_BUCKET_NAME: string;
  JWKS_URL: string;
}

export const VAULT_SETTINGS = {
  REGION: "us-east-005",
  CACHE_TTL: 2592000,
  CORS_HEADERS: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  },
};

export function getCleanEnv(env: Env) {
  if (!env.B2_ENDPOINT) {
    throw new Error(
      "Configuration Error: B2_ENDPOINT is not defined in wrangler.jsonc or .dev.vars"
    );
  }

  const host = env.B2_ENDPOINT.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return {
    ...env,
    B2_HOSTNAME: host,
    B2_S3_BASE: `https://${host}`,
  };
}

export function createVaultCacheKey(url: URL, request: Request) {
  const cleanUrl = new URL(url.origin + url.pathname);
  return new Request(cleanUrl.toString(), request);
}
