/**
 * Pure month/period math for the statistics engine.
 *
 * The SQL layer always aggregates at *month* grain (`date_trunc('month', …)`);
 * these helpers turn a requested range into a contiguous month series and then
 * bucket those months into month/quarter/year periods. Keeping it pure means
 * the bucketing — the part that's easy to get subtly wrong — is unit-tested
 * without a database.
 *
 * A "month key" is the string `YYYY-MM`. A "month start" is the date
 * `YYYY-MM-01` (used directly in SQL date comparisons).
 */

export type GroupBy = "month" | "quarter" | "year";

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: string): boolean {
  return MONTH_KEY_RE.test(value);
}

export function parseMonth(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }
  return { year, month };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `YYYY-MM` for a (year, 1-indexed month), normalizing month overflow/underflow. */
export function monthKeyOf(year: number, month: number): string {
  // month is 1-indexed; normalize via Date's rollover on a UTC anchor.
  const d = new Date(Date.UTC(year, month - 1, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

/** `YYYY-MM-01` month-start date string for a month key. */
export function monthStartDate(monthKey: string): string {
  return `${monthKey}-01`;
}

/** Add `delta` months to a month key (delta may be negative). */
export function addMonths(monthKey: string, delta: number): string {
  const { year, month } = parseMonth(monthKey);
  return monthKeyOf(year, month + delta);
}

/** Number of months from `start` to `end` inclusive (end >= start). */
export function monthSpan(startKey: string, endKey: string): number {
  const a = parseMonth(startKey);
  const b = parseMonth(endKey);
  return (b.year - a.year) * 12 + (b.month - a.month) + 1;
}

/** Contiguous ascending list of month keys from `start` to `end` inclusive. */
export function enumerateMonths(startKey: string, endKey: string): string[] {
  const span = monthSpan(startKey, endKey);
  if (span <= 0) return [];
  const months: string[] = [];
  for (let i = 0; i < span; i++) {
    months.push(addMonths(startKey, i));
  }
  return months;
}

/** The period a month falls into, for the chosen grouping. */
export function bucketFor(
  monthKey: string,
  groupBy: GroupBy,
): { key: string; label: string } {
  const { year, month } = parseMonth(monthKey);

  if (groupBy === "year") {
    return { key: String(year), label: String(year) };
  }

  if (groupBy === "quarter") {
    const quarter = Math.floor((month - 1) / 3) + 1;
    return { key: `${year}-Q${quarter}`, label: `Q${quarter} ${year}` };
  }

  return { key: monthKey, label: monthKey };
}

export type ResolvedRange = {
  startMonth: string;
  endMonth: string;
  /** `YYYY-MM-01` of the first month — inclusive lower bound for SQL. */
  startDate: string;
  /** `YYYY-MM-01` of the month *after* `endMonth` — exclusive upper bound. */
  endExclusiveDate: string;
  months: string[];
};

export type RangeViolation = "INVALID_RANGE" | "RANGE_TOO_LARGE";

export type ResolveRangeResult =
  | { ok: true; range: ResolvedRange }
  | { ok: false; violation: RangeViolation };

/**
 * Resolve a (possibly partial) range request against "now".
 *
 *  - `endMonth` defaults to the current month; may not be in the future.
 *  - `startMonth` defaults to `defaultMonths - 1` before the end.
 *  - start must not be after end, and the span may not exceed `maxMonths`.
 *
 * Returns a typed violation instead of throwing — the caller maps it to a
 * cataloged error (mirrors the members `cancellation` domain).
 */
export function resolveMonthRange(
  input: { startMonth?: string; endMonth?: string },
  options: { currentMonth: string; defaultMonths: number; maxMonths: number },
): ResolveRangeResult {
  const { currentMonth, defaultMonths, maxMonths } = options;

  const endMonth = input.endMonth ?? currentMonth;
  if (monthSpan(endMonth, currentMonth) <= 0) {
    // end is strictly after current month → in the future.
    return { ok: false, violation: "INVALID_RANGE" };
  }

  const startMonth = input.startMonth ?? addMonths(endMonth, -(defaultMonths - 1));

  const span = monthSpan(startMonth, endMonth);
  if (span <= 0) {
    return { ok: false, violation: "INVALID_RANGE" };
  }
  if (span > maxMonths) {
    return { ok: false, violation: "RANGE_TOO_LARGE" };
  }

  return {
    ok: true,
    range: {
      startMonth,
      endMonth,
      startDate: monthStartDate(startMonth),
      endExclusiveDate: monthStartDate(addMonths(endMonth, 1)),
      months: enumerateMonths(startMonth, endMonth),
    },
  };
}
