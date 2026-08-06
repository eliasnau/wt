import { describe, expect, it } from "vitest";

import {
  calculateInitialPeriodEndDate,
  lastDayOfMonth,
} from "./contract";

describe("lastDayOfMonth", () => {
  it("handles 31-day months", () => {
    expect(lastDayOfMonth(2026, 1)).toBe(31);
    expect(lastDayOfMonth(2026, 12)).toBe(31);
  });

  it("handles 30-day months", () => {
    expect(lastDayOfMonth(2026, 4)).toBe(30);
    expect(lastDayOfMonth(2026, 11)).toBe(30);
  });

  it("handles February in non-leap years", () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28);
  });

  it("handles February in leap years", () => {
    expect(lastDayOfMonth(2024, 2)).toBe(29);
    expect(lastDayOfMonth(2000, 2)).toBe(29); // div by 400
    expect(lastDayOfMonth(1900, 2)).toBe(28); // div by 100 but not 400
  });
});

describe("calculateInitialPeriodEndDate", () => {
  it("monthly ends on the last day of the start month", () => {
    expect(calculateInitialPeriodEndDate("2026-01-01", "monthly")).toBe(
      "2026-01-31",
    );
    expect(calculateInitialPeriodEndDate("2026-04-01", "monthly")).toBe(
      "2026-04-30",
    );
  });

  it("half-yearly ends six months later", () => {
    expect(calculateInitialPeriodEndDate("2026-01-01", "half_yearly")).toBe(
      "2026-06-30",
    );
    expect(calculateInitialPeriodEndDate("2026-09-01", "half_yearly")).toBe(
      "2027-02-28",
    );
  });

  it("yearly ends on the same day a year later", () => {
    expect(calculateInitialPeriodEndDate("2026-01-01", "yearly")).toBe(
      "2026-12-31",
    );
    expect(calculateInitialPeriodEndDate("2025-03-01", "yearly")).toBe(
      "2026-02-28",
    );
  });

  it("honours leap years for February starts", () => {
    expect(calculateInitialPeriodEndDate("2024-02-01", "monthly")).toBe(
      "2024-02-29",
    );
    expect(calculateInitialPeriodEndDate("2024-09-01", "half_yearly")).toBe(
      "2025-02-28",
    );
  });

  it("rejects garbage input", () => {
    expect(() => calculateInitialPeriodEndDate("not-a-date", "monthly")).toThrow();
  });
});
