import { describe, expect, it } from "vitest";

import { monthStartSchema, ymdSchema } from "./schemas";

describe("ymdSchema", () => {
  it("accepts a real calendar date", () => {
    expect(ymdSchema.safeParse("2026-02-28").success).toBe(true);
    expect(ymdSchema.safeParse("2024-02-29").success).toBe(true); // leap day
  });

  it("rejects shape-valid but impossible dates", () => {
    expect(ymdSchema.safeParse("2026-99-99").success).toBe(false);
    expect(ymdSchema.safeParse("2026-13-01").success).toBe(false);
    expect(ymdSchema.safeParse("2026-02-30").success).toBe(false);
    expect(ymdSchema.safeParse("2025-02-29").success).toBe(false); // non-leap
  });

  it("rejects malformed strings", () => {
    expect(ymdSchema.safeParse("2026-2-1").success).toBe(false);
    expect(ymdSchema.safeParse("not-a-date").success).toBe(false);
  });
});

describe("monthStartSchema", () => {
  it("accepts the 1st of a real month", () => {
    expect(monthStartSchema.safeParse("2026-03-01").success).toBe(true);
  });

  it("rejects non-first days and impossible months", () => {
    expect(monthStartSchema.safeParse("2026-03-02").success).toBe(false);
    expect(monthStartSchema.safeParse("2026-13-01").success).toBe(false);
  });
});
