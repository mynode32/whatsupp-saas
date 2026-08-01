import { describe, it, expect } from "vitest";
import { csvEscape } from "./csv";

describe("csvEscape", () => {
  it("leaves plain values untouched", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape("open")).toBe("open");
  });

  it("quotes values containing a comma", () => {
    expect(csvEscape("Smith, John")).toBe('"Smith, John"');
  });

  it("quotes and doubles internal quotes", () => {
    expect(csvEscape('He said "hi"')).toBe('"He said ""hi"""');
  });

  it("quotes values containing a newline", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("handles an empty string", () => {
    expect(csvEscape("")).toBe("");
  });

  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)"])("neutralizes spreadsheet formulas: %s", (value) => {
    expect(csvEscape(value)).toBe(`'${value}`);
  });
});
