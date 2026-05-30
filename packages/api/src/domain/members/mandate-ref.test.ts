import { describe, expect, it } from "vitest";

import { generateMandateReference } from "./mandate-ref";

describe("generateMandateReference", () => {
  it("matches the documented format (MD-<24 hex chars>)", () => {
    expect(generateMandateReference()).toMatch(/^MD-[0-9A-F]{24}$/);
  });

  it("stays within the SEPA 35-char limit", () => {
    expect(generateMandateReference().length).toBeLessThanOrEqual(35);
  });

  it("generates unique references", () => {
    const refs = new Set(
      Array.from({ length: 200 }, () => generateMandateReference()),
    );
    expect(refs.size).toBe(200);
  });
});
