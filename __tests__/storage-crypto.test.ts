import { createId, hashPassword, verifyPassword, createToken } from "@/lib/storage-crypto";

describe("createId", () => {
  it("returns string starting with prefix", () => {
    const id = createId("user");
    expect(id).toMatch(/^user-/);
  });

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId("test")));
    expect(ids.size).toBe(100);
  });

  it("uses the provided prefix", () => {
    expect(createId("session")).toMatch(/^session-/);
    expect(createId("request")).toMatch(/^request-/);
  });

  it("contains a UUID-like segment after prefix", () => {
    const id = createId("x");
    const uuidPart = id.slice("x-".length);
    // UUID format: 8-4-4-4-12 hex chars
    expect(uuidPart).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

describe("createToken", () => {
  it("returns a 64 character hex string", () => {
    const token = createToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => createToken()));
    expect(tokens.size).toBe(50);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("verifyPassword returns true for matching password", () => {
    const password = "mySecurePass123!";
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("verifyPassword returns false for wrong password", () => {
    const hash = hashPassword("correct");
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("hash format contains salt:hash separated by colon", () => {
    const hash = hashPassword("test");
    const parts = hash.split(":");
    expect(parts).toHaveLength(2);
    // salt is 32 hex chars (16 bytes)
    expect(parts[0]).toHaveLength(32);
    expect(parts[0]).toMatch(/^[0-9a-f]+$/);
    // hash is 128 hex chars (64 bytes)
    expect(parts[1]).toHaveLength(128);
    expect(parts[1]).toMatch(/^[0-9a-f]+$/);
  });

  it("produces different hashes for same password (random salt)", () => {
    const h1 = hashPassword("same");
    const h2 = hashPassword("same");
    expect(h1).not.toBe(h2);
    // But both should verify
    expect(verifyPassword("same", h1)).toBe(true);
    expect(verifyPassword("same", h2)).toBe(true);
  });

  it("verifyPassword returns false for malformed stored hash", () => {
    expect(verifyPassword("test", "")).toBe(false);
    expect(verifyPassword("test", "noseparator")).toBe(false);
  });
});
