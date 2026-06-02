/**
 * Pure date arithmetic for billing. Dates are `YYYY-MM-DD` strings throughout;
 * billing months are always the 1st (`YYYY-MM-01`). ISO date strings compare
 * correctly with `<`/`>`, which the planning code relies on — there is no
 * `Date` object in the hot path, so timezones never enter into it.
 */

export type Ymd = { year: number; month: number; day: number };

/** Parse a strict `YYYY-MM-DD`. Returns null on malformed or impossible dates. */
export function parseYmd(value: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Number of days in a (year, 1-indexed month), leap-year aware. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function requireYmd(value: string): Ymd {
  const parsed = parseYmd(value);
  if (!parsed) throw new Error(`Invalid date: ${value}`);
  return parsed;
}

/** `YYYY-MM-01` for the month containing `value`. */
export function firstDayOfMonth(value: string): string {
  const { year, month } = requireYmd(value);
  return formatYmd(year, month, 1);
}

/** `YYYY-MM-DD` of the last day of the month containing `value`. */
export function lastDayOfMonth(value: string): string {
  const { year, month } = requireYmd(value);
  return formatYmd(year, month, daysInMonth(year, month));
}

/**
 * Add `count` months to `value` and return the **1st** of the resulting month.
 * `count` may be negative. The day component is intentionally dropped — billing
 * only ever steps month-to-month.
 */
export function addMonths(value: string, count: number): string {
  const { year, month } = requireYmd(value);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return formatYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

/** The 1-indexed month number (1–12) of a `YYYY-MM-DD`. */
export function monthNumber(value: string): number {
  return Number(value.slice(5, 7));
}

/** The 4-digit year of a `YYYY-MM-DD`. */
export function yearNumber(value: string): number {
  return Number(value.slice(0, 4));
}

/** Human label like "January 2026" for invoice-line descriptions (UTC, en-US). */
export function monthLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${firstDayOfMonth(value)}T00:00:00.000Z`));
}
