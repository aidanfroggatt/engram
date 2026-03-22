import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeRequest } from "./auth";
import { processVaultMiss } from "./storage";

// 1. Mock the dependencies
vi.mock("./auth", () => ({
  authorizeRequest: vi.fn(),
}));

// Mock aws4fetch so we don't do real crypto during tests
vi.mock("aws4fetch", () => {
  return {
    AwsClient: vi.fn().mockImplementation(() => ({
      sign: vi.fn().mockResolvedValue(new Request("https://signed-b2-url.com")),
    })),
  };
});

describe("Storage Layer (B2 Proxy)", () => {
  const mockConfig = {
    JWKS_URL: "https://auth.com/jwks",
    B2_KEY_ID: "mock-id",
    B2_APP_KEY: "mock-key",
    B2_S3_BASE: "https://s3.b2.com",
    B2_BUCKET_NAME: "engram-vault",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw 401 if token is missing from search params", async () => {
    const req = new Request("https://proxy.com/user/file.jpg");
    await expect(processVaultMiss(req, mockConfig)).rejects.toMatchObject({
      status: 401,
      msg: "Missing Vault Token",
    });
  });

  it("should fetch from B2 and attach immutable cache headers on success", async () => {
    // Simulate successful Auth
    vi.mocked(authorizeRequest).mockResolvedValue("user123");

    // Mock global fetch to return a fake B2 image
    const mockB2Body = "fake-binary-data";
    global.fetch = vi.fn().mockResolvedValue(
      new Response(mockB2Body, {
        status: 200,
        statusText: "OK",
      })
    );

    const req = new Request("https://proxy.com/user123/image.png?token=valid-jwt");
    const result = await processVaultMiss(req, mockConfig);

    expect(result.status).toBe(200);
    expect(await result.text()).toBe(mockB2Body);

    // Verify our custom Cache-Control is set
    expect(result.headers.get("Cache-Control")).toContain("immutable");
    expect(result.headers.get("Cache-Control")).toContain("max-age=2592000");
  });

  it("should bubble up B2 errors as custom Engram errors", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue("user123");

    // Mock global fetch to return a 404 from B2
    global.fetch = vi.fn().mockResolvedValue(
      new Response("Not Found", {
        status: 404,
      })
    );

    const req = new Request("https://proxy.com/user123/missing.png?token=jwt");

    await expect(processVaultMiss(req, mockConfig)).rejects.toMatchObject({
      status: 404,
      msg: "B2_STORAGE_ERROR_404",
    });
  });
});
