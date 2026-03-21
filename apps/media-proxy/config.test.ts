import { describe, expect, it } from "vitest";
import { createVaultCacheKey, Env, getCleanEnv } from "./config";

describe("Config Utilities", () => {
  it("getCleanEnv should format hostname and base URL correctly", () => {
    const mockEnv: Env = {
      B2_ENDPOINT: "https://s3.us-east-005.backblazeb2.com/",
      B2_KEY_ID: "id",
      B2_APP_KEY: "key",
      B2_BUCKET_NAME: "vault",
      JWKS_URL: "https://auth.com",
    };

    const clean = getCleanEnv(mockEnv);
    expect(clean.B2_HOSTNAME).toBe("s3.us-east-005.backblazeb2.com");
    expect(clean.B2_S3_BASE).toBe("https://s3.us-east-005.backblazeb2.com");
  });

  it("createVaultCacheKey should strip query parameters for pure path caching", () => {
    const url = new URL("https://proxy.com/user1/image.jpg?token=123&other=abc");
    const request = new Request(url.toString());

    const cacheKey = createVaultCacheKey(url, request);
    expect(cacheKey.url).toBe("https://proxy.com/user1/image.jpg");
    expect(cacheKey.method).toBe("GET");
  });
});
