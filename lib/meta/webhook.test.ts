import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidMetaSignature } from "./webhook";

describe("isValidMetaSignature", () => {
  const body = JSON.stringify({ object: "instagram", entry: [] });
  const secret = "test-app-secret";

  it("accepts the matching sha256 signature", () => {
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(isValidMetaSignature(body, signature, secret)).toBe(true);
  });

  it("rejects a modified body and malformed signatures", () => {
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(isValidMetaSignature(`${body} `, signature, secret)).toBe(false);
    expect(isValidMetaSignature(body, "bad", secret)).toBe(false);
  });
});
