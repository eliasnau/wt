import { describe, expect, it } from "vitest";

import { timesOverlap } from "./conflicts";

describe("coaching time conflicts", () => {
  it("detects overlaps but permits touching appointments", () => {
    expect(timesOverlap("10:00", "11:00", "10:30", "11:30")).toBe(true);
    expect(timesOverlap("10:00", "11:00", "11:00", "12:00")).toBe(false);
  });
});
