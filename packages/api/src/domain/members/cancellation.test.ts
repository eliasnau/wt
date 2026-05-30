import { describe, expect, it } from "vitest";

import { validateCancellationDate, ymdInBerlin } from "./cancellation";

// Pick a last-of-month so we can also use `today` itself as a test input
// (the IN_PAST check only fires once the date passes the last-day check).
const today = "2026-05-31";

describe("validateCancellationDate", () => {
  it("accepts a valid future last-of-month date", () => {
    expect(
      validateCancellationDate("2026-12-31", { today }),
    ).toBeNull();
  });

  it("rejects a malformed date", () => {
    expect(
      validateCancellationDate("not-a-date", { today }),
    ).toBe("INVALID_DATE");
    expect(
      validateCancellationDate("2026-13-01", { today }),
    ).toBe("INVALID_DATE");
  });

  it("rejects mid-month dates", () => {
    expect(
      validateCancellationDate("2026-12-15", { today }),
    ).toBe("NOT_LAST_DAY");
  });

  it("rejects dates in the past or today", () => {
    expect(
      validateCancellationDate("2026-04-30", { today }),
    ).toBe("IN_PAST");
    expect(
      validateCancellationDate(today, { today }),
    ).toBe("IN_PAST");
  });

  it("rejects dates inside the initial period", () => {
    expect(
      validateCancellationDate("2026-08-31", {
        today,
        initialPeriodEndDate: "2026-12-31",
      }),
    ).toBe("BEFORE_INITIAL_PERIOD");
  });

  it("accepts dates on or after the initial-period end", () => {
    expect(
      validateCancellationDate("2026-12-31", {
        today,
        initialPeriodEndDate: "2026-12-31",
      }),
    ).toBeNull();
  });
});

describe("ymdInBerlin", () => {
  it("formats a known instant in CET", () => {
    expect(ymdInBerlin(new Date("2026-01-15T10:00:00Z"))).toBe("2026-01-15");
  });

  it("formats a known instant in CEST (summer time)", () => {
    // 2026-07-15 00:30 UTC is 02:30 in Berlin → still the 15th
    expect(ymdInBerlin(new Date("2026-07-15T00:30:00Z"))).toBe("2026-07-15");
  });

  it("rolls over into the next Berlin day for late UTC instants", () => {
    // 2026-07-14 23:30 UTC is 01:30 on the 15th in Berlin
    expect(ymdInBerlin(new Date("2026-07-14T23:30:00Z"))).toBe("2026-07-15");
  });
});
