import { describe, expect, it } from "vitest";
import { finalizeResponse, handlePreflight } from "./delivery";

describe("Delivery / Edge Headers", () => {
  it("handlePreflight returns correct CORS headers", () => {
    const res = handlePreflight();
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
  });

  it("finalizeResponse injects custom X-Vault headers", () => {
    const original = new Response("data", {
      headers: { "CF-Cache-Status": "HIT" },
    });
    const final = finalizeResponse(original);

    expect(final.headers.get("X-Vault-Status")).toBe("HIT");
    expect(final.headers.get("X-Engram-Origin")).toBe("Edge-Proxy");
    expect(final.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
