import { describe, it, expect } from "vitest";
import { isRateLimited } from "./rate-limit";

describe("isRateLimited", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, 5)).toBe(false);
    }
  });

  it("blocks once the limit is exceeded within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) isRateLimited(key, 5);
    expect(isRateLimited(key, 5)).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) isRateLimited(keyA, 5);
    expect(isRateLimited(keyA, 5)).toBe(true);
    expect(isRateLimited(keyB, 5)).toBe(false);
  });

  it("resets after the window elapses", async () => {
    const key = `test-window-${Math.random()}`;
    isRateLimited(key, 1, 50); // 1 request per 50ms window
    expect(isRateLimited(key, 1, 50)).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(isRateLimited(key, 1, 50)).toBe(false);
  });
});
