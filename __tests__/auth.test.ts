import { getBearerToken } from "@/lib/auth";

describe("getBearerToken", () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request("http://localhost/api/test", { headers });
  }

  it("extracts token from valid Bearer header", () => {
    const req = makeRequest({ authorization: "Bearer abc123token" });
    expect(getBearerToken(req)).toBe("abc123token");
  });

  it("returns null when no authorization header", () => {
    const req = makeRequest({});
    expect(getBearerToken(req)).toBeNull();
  });

  it("returns null for non-bearer scheme", () => {
    const req = makeRequest({ authorization: "Basic abc123" });
    expect(getBearerToken(req)).toBeNull();
  });

  it("is case-insensitive for scheme", () => {
    const req = makeRequest({ authorization: "bearer mytoken" });
    expect(getBearerToken(req)).toBe("mytoken");

    const req2 = makeRequest({ authorization: "BEARER mytoken2" });
    expect(getBearerToken(req2)).toBe("mytoken2");
  });

  it("returns null for malformed header (no space)", () => {
    const req = makeRequest({ authorization: "Bearertoken" });
    expect(getBearerToken(req)).toBeNull();
  });

  it("returns null for empty token", () => {
    const req = makeRequest({ authorization: "Bearer " });
    expect(getBearerToken(req)).toBeNull();
  });

  it("handles token with special characters", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.payload.signature";
    const req = makeRequest({ authorization: `Bearer ${token}` });
    expect(getBearerToken(req)).toBe(token);
  });
});
