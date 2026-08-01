import { describe, expect, it } from "vitest";
import { normalizeAllowedOrigins } from "./origins";

describe("normalizeAllowedOrigins", () => {
  it("normalizes paths and removes duplicates", () => {
    expect(normalizeAllowedOrigins("https://example.com/shop, https://example.com"))
      .toEqual(["https://example.com"]);
  });

  it("allows localhost over http for development", () => {
    expect(normalizeAllowedOrigins("http://localhost:3001/path"))
      .toEqual(["http://localhost:3001"]);
  });

  it("rejects insecure public origins", () => {
    expect(() => normalizeAllowedOrigins("http://example.com")).toThrow(/HTTPS/);
  });

  it("rejects invalid URLs", () => {
    expect(() => normalizeAllowedOrigins("not-a-url")).toThrow();
  });
});
