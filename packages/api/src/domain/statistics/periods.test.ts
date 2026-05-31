import { describe, expect, it } from "vitest";

import {
  addMonths,
  bucketFor,
  enumerateMonths,
  isMonthKey,
  monthKeyOf,
  monthSpan,
  monthStartDate,
  resolveMonthRange,
} from "./periods";

describe("isMonthKey", () => {
  it("accepts YYYY-MM and rejects junk", () => {
    expect(isMonthKey("2026-01")).toBe(true);
    expect(isMonthKey("2026-12")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-00")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
    expect(isMonthKey("2026-01-01")).toBe(false);
  });
});

describe("monthKeyOf / addMonths", () => {
  it("normalizes month overflow and underflow across year boundaries", () => {
    expect(monthKeyOf(2026, 13)).toBe("2027-01");
    expect(monthKeyOf(2026, 0)).toBe("2025-12");
    expect(addMonths("2026-11", 3)).toBe("2027-02");
    expect(addMonths("2026-02", -3)).toBe("2025-11");
  });
});

describe("monthStartDate", () => {
  it("appends -01", () => {
    expect(monthStartDate("2026-05")).toBe("2026-05-01");
  });
});

describe("monthSpan", () => {
  it("is inclusive", () => {
    expect(monthSpan("2026-01", "2026-01")).toBe(1);
    expect(monthSpan("2026-01", "2026-12")).toBe(12);
    expect(monthSpan("2025-11", "2026-02")).toBe(4);
  });

  it("is non-positive when end precedes start", () => {
    expect(monthSpan("2026-02", "2026-01")).toBe(0);
    expect(monthSpan("2026-03", "2026-01")).toBe(-1);
  });
});

describe("enumerateMonths", () => {
  it("produces a contiguous ascending series", () => {
    expect(enumerateMonths("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns a single month when start === end", () => {
    expect(enumerateMonths("2026-05", "2026-05")).toEqual(["2026-05"]);
  });

  it("returns empty when reversed", () => {
    expect(enumerateMonths("2026-05", "2026-04")).toEqual([]);
  });
});

describe("bucketFor", () => {
  it("buckets by month (identity)", () => {
    expect(bucketFor("2026-05", "month")).toEqual({
      key: "2026-05",
      label: "2026-05",
    });
  });

  it("buckets by quarter", () => {
    expect(bucketFor("2026-01", "quarter")).toEqual({
      key: "2026-Q1",
      label: "Q1 2026",
    });
    expect(bucketFor("2026-03", "quarter").key).toBe("2026-Q1");
    expect(bucketFor("2026-04", "quarter").key).toBe("2026-Q2");
    expect(bucketFor("2026-12", "quarter").key).toBe("2026-Q4");
  });

  it("buckets by year", () => {
    expect(bucketFor("2026-07", "year")).toEqual({
      key: "2026",
      label: "2026",
    });
  });
});

describe("resolveMonthRange", () => {
  const opts = { currentMonth: "2026-05", defaultMonths: 12, maxMonths: 120 };

  it("defaults to the last `defaultMonths` ending at the current month", () => {
    const result = resolveMonthRange({}, opts);
    expect(result).toEqual({
      ok: true,
      range: {
        startMonth: "2025-06",
        endMonth: "2026-05",
        startDate: "2025-06-01",
        endExclusiveDate: "2026-06-01",
        months: expect.any(Array),
      },
    });
    if (result.ok) expect(result.range.months).toHaveLength(12);
  });

  it("honors an explicit start and end", () => {
    const result = resolveMonthRange(
      { startMonth: "2026-01", endMonth: "2026-03" },
      opts,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.range.startDate).toBe("2026-01-01");
      expect(result.range.endExclusiveDate).toBe("2026-04-01");
      expect(result.range.months).toEqual(["2026-01", "2026-02", "2026-03"]);
    }
  });

  it("rejects an end month in the future", () => {
    expect(resolveMonthRange({ endMonth: "2026-06" }, opts)).toEqual({
      ok: false,
      violation: "INVALID_RANGE",
    });
  });

  it("rejects start after end", () => {
    expect(
      resolveMonthRange({ startMonth: "2026-04", endMonth: "2026-02" }, opts),
    ).toEqual({ ok: false, violation: "INVALID_RANGE" });
  });

  it("rejects a span larger than maxMonths", () => {
    expect(
      resolveMonthRange(
        { startMonth: "2026-01", endMonth: "2026-05" },
        { ...opts, maxMonths: 3 },
      ),
    ).toEqual({ ok: false, violation: "RANGE_TOO_LARGE" });
  });
});
