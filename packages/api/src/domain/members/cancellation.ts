import { lastDayOfMonth } from "./contract";

export type CancellationViolation =
  | "INVALID_DATE"
  | "NOT_LAST_DAY"
  | "IN_PAST"
  | "BEFORE_INITIAL_PERIOD";

type DateParts = { year: number; month: number; day: number };

function parseYmd(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12) return null;
  if (day < 1 || day > lastDayOfMonth(year, month)) return null;
  return { year, month, day };
}

/**
 * Current date in Europe/Berlin as YYYY-MM-DD. Takes `now` as a parameter so
 * it stays pure and testable.
 */
export function ymdInBerlin(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) return now.toISOString().slice(0, 10);
  return `${year}-${month}-${day}`;
}

/**
 * Validate a contract cancellation effective date. Returns the first
 * violation encountered, or `null` if the date is acceptable.
 *
 * Rules (in order):
 *   1. Date parses as a real YYYY-MM-DD.
 *   2. Date is the last day of its calendar month.
 *   3. Date is strictly after `today`.
 *   4. Date is on or after `initialPeriodEndDate` (when provided).
 */
export function validateCancellationDate(
  effectiveDate: string,
  options: { today: string; initialPeriodEndDate?: string | null },
): CancellationViolation | null {
  const parts = parseYmd(effectiveDate);
  if (!parts) return "INVALID_DATE";
  if (parts.day !== lastDayOfMonth(parts.year, parts.month)) return "NOT_LAST_DAY";
  if (effectiveDate <= options.today) return "IN_PAST";
  if (
    options.initialPeriodEndDate &&
    effectiveDate < options.initialPeriodEndDate
  ) {
    return "BEFORE_INITIAL_PERIOD";
  }
  return null;
}
