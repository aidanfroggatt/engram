import { createVaultCacheKey, Env, getCleanEnv } from "./config";
import { finalizeResponse, handlePreflight } from "./delivery";
import { processVaultMiss } from "./storage";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const config = getCleanEnv(env);

    // 1. Preflight
    if (request.method === "OPTIONS") return handlePreflight();

    // 2. Cache Match
    const cache = caches.default;
    const cacheKey = createVaultCacheKey(new URL(request.url), request);
    let response = await cache.match(cacheKey);

    if (!response) {
      try {
        // 3. Run Pipeline
        response = await processVaultMiss(request, config);

        // 4. Background Cache Update
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (err: any) {
        // Fallback response for errors
        response = new Response(err.msg || "Vault Pipeline Failed", {
          status: err.status || 500,
        });
      }
    }

    // 5. Delivery
    return finalizeResponse(response);
  },
};
