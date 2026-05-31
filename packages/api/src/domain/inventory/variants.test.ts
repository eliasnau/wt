import { describe, expect, it } from "vitest";

import {
  buildVariantCombinations,
  getCombinationKey,
  getCombinationTuple,
  normalizeKeyPart,
} from "./variants";

describe("normalizeKeyPart", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(normalizeKeyPart("  Dunkel  Rot ")).toBe("dunkel rot");
  });
});

describe("getCombinationKey", () => {
  it("is __default__ when there are no options", () => {
    expect(getCombinationKey([])).toBe("__default__");
  });

  it("joins normalized attribute=value pairs", () => {
    expect(
      getCombinationKey([
        { attributeName: "Größe", value: "M" },
        { attributeName: "Farbe", value: "Rot" },
      ]),
    ).toBe("größe=m|farbe=rot");
  });

  it("is stable across casing/whitespace differences", () => {
    const a = getCombinationKey([{ attributeName: "Farbe", value: "Rot" }]);
    const b = getCombinationKey([{ attributeName: "farbe ", value: " rot" }]);
    expect(a).toBe(b);
  });
});

describe("buildVariantCombinations", () => {
  it("yields a single default variant with no attributes", () => {
    expect(buildVariantCombinations([])).toEqual([
      { combinationKey: "__default__", options: [] },
    ]);
  });

  it("returns nothing if any attribute has zero values", () => {
    expect(
      buildVariantCombinations([
        { name: "Größe", values: ["S"] },
        { name: "Farbe", values: [] },
      ]),
    ).toEqual([]);
  });

  it("produces the cartesian product in attribute order", () => {
    const combos = buildVariantCombinations([
      { name: "Größe", values: ["S", "M"] },
      { name: "Farbe", values: ["rot", "blau"] },
    ]);
    expect(combos.map((c) => c.combinationKey)).toEqual([
      "größe=s|farbe=rot",
      "größe=s|farbe=blau",
      "größe=m|farbe=rot",
      "größe=m|farbe=blau",
    ]);
    expect(combos[0]?.options).toEqual([
      { attributeName: "Größe", value: "S" },
      { attributeName: "Farbe", value: "rot" },
    ]);
  });
});

describe("getCombinationTuple", () => {
  const attributes = [
    { name: "Größe", values: ["S", "M", "L"] },
    { name: "Farbe", values: ["rot", "blau"] },
  ];

  it("is __default__ when there are no attributes", () => {
    expect(getCombinationTuple([], [])).toBe("__default__");
  });

  it("maps selected values to their positional indices", () => {
    expect(
      getCombinationTuple(
        [
          { attributeName: "Größe", value: "M" },
          { attributeName: "Farbe", value: "blau" },
        ],
        attributes,
      ),
    ).toBe("1|1");
  });

  it("survives a value rename (same index, different casing)", () => {
    // "rot" renamed to "Rot": tuple unchanged so stock can follow the variant.
    const renamed = [
      { name: "Größe", values: ["S", "M", "L"] },
      { name: "Farbe", values: ["Rot", "blau"] },
    ];
    const before = getCombinationTuple(
      [
        { attributeName: "Größe", value: "S" },
        { attributeName: "Farbe", value: "rot" },
      ],
      attributes,
    );
    const after = getCombinationTuple(
      [
        { attributeName: "Größe", value: "S" },
        { attributeName: "Farbe", value: "Rot" },
      ],
      renamed,
    );
    expect(before).toBe("0|0");
    expect(after).toBe("0|0");
  });

  it("returns null for a stale combination missing an attribute", () => {
    expect(
      getCombinationTuple(
        [{ attributeName: "Größe", value: "M" }],
        attributes,
      ),
    ).toBeNull();
  });

  it("returns null when a selected value no longer exists", () => {
    expect(
      getCombinationTuple(
        [
          { attributeName: "Größe", value: "XL" },
          { attributeName: "Farbe", value: "rot" },
        ],
        attributes,
      ),
    ).toBeNull();
  });
});
