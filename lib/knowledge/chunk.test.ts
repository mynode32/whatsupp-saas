import { describe, it, expect } from "vitest";
import { chunkContent } from "./chunk";

describe("chunkContent", () => {
  it("returns a single chunk for short content", () => {
    const chunks = chunkContent("Kargolar 2-3 iş günü içinde teslim edilir.");
    expect(chunks).toEqual(["Kargolar 2-3 iş günü içinde teslim edilir."]);
  });

  it("returns an empty array for empty content", () => {
    expect(chunkContent("")).toEqual([]);
    expect(chunkContent("   \n\n  ")).toEqual([]);
  });

  it("keeps short paragraphs merged into one chunk", () => {
    const content = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
    const chunks = chunkContent(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("Paragraph one.");
    expect(chunks[0]).toContain("Paragraph three.");
  });

  it("splits into multiple chunks once the ~800 char cap is exceeded", () => {
    const paragraph = "x".repeat(500);
    const content = [paragraph, paragraph, paragraph].join("\n\n");
    const chunks = chunkContent(content);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      // Each chunk holds whole paragraphs, so it can exceed 800 by at
      // most one paragraph's length — but must never be empty.
      expect(chunk.length).toBeGreaterThan(0);
    }
  });

  it("never drops content across chunk boundaries", () => {
    const paragraph = "y".repeat(400);
    const content = Array(5).fill(paragraph).join("\n\n");
    const chunks = chunkContent(content);
    const rejoined = chunks.join("\n\n");
    expect(rejoined).toBe(content);
  });
});
