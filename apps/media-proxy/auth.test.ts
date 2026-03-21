import { describe, it, expect, vi } from "vitest";
import { authorizeRequest } from "./auth";
import * as jose from "jose";

// Mock the jose library
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(),
  jwtVerify: vi.fn(),
}));

describe("Authorization Logic", () => {
  const mockJwks = "https://clerk.engram.com/.well-known/jwks.json";

  it("should allow access when userId matches the folderOwner", async () => {
    // Mock successful verification returning user 'aidan'
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: { sub: "aidan" },
    } as any);

    const userId = await authorizeRequest("valid-token", mockJwks, "/aidan/photo.jpg");
    expect(userId).toBe("aidan");
  });

  it("should throw 403 when user attempts to access another user's partition", async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: { sub: "aidan" },
    } as any);

    await expect(
      authorizeRequest("valid-token", mockJwks, "/hacker/photo.jpg")
    ).rejects.toMatchObject({ status: 403, msg: "Vault Partition Mismatch" });
  });
});
