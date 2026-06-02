import { describe, expect, it } from "vitest";

import { cycleKeyForMonth, isYearlyTriggerMonth, yearlyCycleKey } from "./cycle";

describe("yearlyCycleKey", () => {
  const start = "2026-03-01"; // March-anchored contract

  it("keys months at/after the anniversary to that year", () => {
    expect(yearlyCycleKey("2026-03-01", start)).toBe("2026-03");
    expect(yearlyCycleKey("2026-12-01", start)).toBe("2026-03");
  });

  it("keys months before the anniversary to the previous year's cycle", () => {
    expect(yearlyCycleKey("2027-01-01", start)).toBe("2026-03");
    expect(yearlyCycleKey("2027-02-01", start)).toBe("2026-03");
  });

  it("rolls to the next cycle on the next anniversary", () => {
    expect(yearlyCycleKey("2027-03-01", start)).toBe("2027-03");
  });
});

describe("cycleKeyForMonth", () => {
  it("dedupes january mode by calendar year", () => {
    const contract = { yearlyFeeMode: "january", startDate: "2026-03-01" };
    expect(cycleKeyForMonth("2026-01-01", contract)).toBe("2026");
    expect(cycleKeyForMonth("2026-12-01", contract)).toBe("2026");
    expect(cycleKeyForMonth("2027-01-01", contract)).toBe("2027");
  });

  it("dedupes anniversary mode by cycle key", () => {
    const contract = { yearlyFeeMode: "anniversary", startDate: "2026-03-01" };
    expect(cycleKeyForMonth("2026-05-01", contract)).toBe("2026-03");
    expect(cycleKeyForMonth("2027-02-01", contract)).toBe("2026-03");
  });
});

describe("isYearlyTriggerMonth", () => {
  it("triggers in January for january mode", () => {
    const contract = { yearlyFeeMode: "january", startDate: "2026-03-01" };
    expect(isYearlyTriggerMonth("2026-01-01", contract)).toBe(true);
    expect(isYearlyTriggerMonth("2026-03-01", contract)).toBe(false);
  });

  it("triggers in the start month for anniversary mode", () => {
    const contract = { yearlyFeeMode: "anniversary", startDate: "2026-03-01" };
    expect(isYearlyTriggerMonth("2026-03-01", contract)).toBe(true);
    expect(isYearlyTriggerMonth("2027-03-01", contract)).toBe(true);
    expect(isYearlyTriggerMonth("2026-01-01", contract)).toBe(false);
  });
});
