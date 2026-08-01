import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("My Business Name")).toBe("my-business-name");
  });

  it("strips Turkish diacritics down to ASCII", () => {
    expect(slugify("Çiçekçi Güneş")).toBe("cicekci-gunes");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Foo!!!Bar   Baz")).toBe("foo-bar-baz");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });

  it("caps length at 40 characters", () => {
    const long = "a".repeat(60);
    expect(slugify(long)).toHaveLength(40);
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
