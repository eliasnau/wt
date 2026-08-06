import { describe, expect, it } from "vitest";

import {
  addMonths,
  daysInMonth,
  firstDayOfMonth,
  lastDayOfMonth,
  monthLabel,
  monthNumber,
  parseYmd,
  yearNumber,
} from "./dates";

describe("parseYmd", () => {
  it("parses a valid date", () => {
    expect(parseYmd("2026-05-17")).toEqual({ year: 2026, month: 5, day: 17 });
  });

  it("rejects malformed strings", () => {
    expect(parseYmd("2026-5-17")).toBeNull();
    expect(parseYmd("2026/05/17")).toBeNull();
    expect(parseYmd("not-a-date")).toBeNull();
    expect(parseYmd("2026-05-17T00:00")).toBeNull();
  });

  it("rejects impossible months and days", () => {
    expect(parseYmd("2026-00-01")).toBeNull();
    expect(parseYmd("2026-13-01")).toBeNull();
    expect(parseYmd("2026-02-30")).toBeNull();
    expect(parseYmd("2026-04-31")).toBeNull();
    expect(parseYmd("2025-02-29")).toBeNull(); // non-leap
  });

  it("accepts leap day in leap years", () => {
    expect(parseYmd("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
  });
});

describe("daysInMonth", () => {
  it("handles 31/30/Feb-28/Feb-29/century rules", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29); // div 400
    expect(daysInMonth(1900, 2)).toBe(28); // div 100 not 400
  });
});

describe("firstDayOfMonth / lastDayOfMonth", () => {
  it("computes month bounds", () => {
    expect(firstDayOfMonth("2026-05-17")).toBe("2026-05-01");
    expect(lastDayOfMonth("2026-05-17")).toBe("2026-05-31");
    expect(lastDayOfMonth("2024-02-10")).toBe("2024-02-29");
    expect(lastDayOfMonth("2026-02-10")).toBe("2026-02-28");
  });
});

describe("addMonths", () => {
  it("returns the first of the resulting month", () => {
    expect(addMonths("2026-05-17", 1)).toBe("2026-06-01");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("crosses year boundaries forward and backward", () => {
    expect(addMonths("2026-11-01", 3)).toBe("2027-02-01");
    expect(addMonths("2026-02-01", -3)).toBe("2025-11-01");
    expect(addMonths("2026-06-01", 12)).toBe("2027-06-01");
    expect(addMonths("2026-06-01", -12)).toBe("2025-06-01");
  });

  it("is identity for 0", () => {
    expect(addMonths("2026-06-15", 0)).toBe("2026-06-01");
  });
});

describe("monthNumber / yearNumber", () => {
  it("extracts components", () => {
    expect(monthNumber("2026-03-01")).toBe(3);
    expect(yearNumber("2026-03-01")).toBe(2026);
  });
});

describe("monthLabel", () => {
  it("formats a human month label", () => {
    expect(monthLabel("2026-01-01")).toBe("January 2026");
    expect(monthLabel("2026-12-15")).toBe("December 2026");
  });
});
