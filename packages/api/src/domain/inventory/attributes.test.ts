import { describe, expect, it } from "vitest";

import { dedupeValues, normalizeAttributes } from "./attributes";

describe("dedupeValues", () => {
  it("trims and collapses internal whitespace", () => {
    expect(dedupeValues(["  rot ", "blau\tgrün"])).toEqual(["rot", "blau grün"]);
  });

  it("drops empties", () => {
    expect(dedupeValues(["", "   ", "rot"])).toEqual(["rot"]);
  });

  it("drops case-insensitive duplicates, keeping first-seen casing + order", () => {
    expect(dedupeValues(["Rot", "rot", "Blau", "ROT"])).toEqual(["Rot", "Blau"]);
  });
});

describe("normalizeAttributes", () => {
  it("normalizes names and values", () => {
    const result = normalizeAttributes([
      { name: "  Größe ", values: ["S", "M", "M"] },
    ]);
    expect(result).toEqual({
      ok: true,
      attributes: [{ name: "Größe", values: ["S", "M"] }],
    });
  });

  it("skips attributes with no name or no values", () => {
    const result = normalizeAttributes([
      { name: "", values: ["S"] },
      { name: "Farbe", values: ["  ", ""] },
      { name: "Größe", values: ["S"] },
    ]);
    expect(result).toEqual({
      ok: true,
      attributes: [{ name: "Größe", values: ["S"] }],
    });
  });

  it("rejects case-insensitive duplicate attribute names", () => {
    const result = normalizeAttributes([
      { name: "Farbe", values: ["rot"] },
      { name: "farbe", values: ["blau"] },
    ]);
    expect(result).toEqual({ ok: false, duplicateName: "farbe" });
  });

  it("returns an empty list for empty input", () => {
    expect(normalizeAttributes([])).toEqual({ ok: true, attributes: [] });
  });
});
