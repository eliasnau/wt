export type InitialPeriod = "monthly" | "half_yearly" | "yearly";

const PERIOD_MONTHS: Record<InitialPeriod, number> = {
  monthly: 1,
  half_yearly: 6,
  yearly: 12,
};

function formatYmd(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Last day of the calendar month for a given (year, 1-indexed month).
 * Handles leap years natively via Date's day-0-of-next-month trick.
 */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Given a contract start date (YYYY-MM-01) and initial period, return the
 * last day of the period as YYYY-MM-DD.
 *
 * Examples:
 *   ("2026-01-01", "monthly")      → "2026-01-31"
 *   ("2026-01-01", "half_yearly")  → "2026-06-30"
 *   ("2026-01-01", "yearly")       → "2026-12-31"
 *   ("2024-02-01", "monthly")      → "2024-02-29" (leap year)
 */
export function calculateInitialPeriodEndDate(
  startDate: string,
  period: InitialPeriod,
): string {
  const [year, month] = startDate.split("-").map(Number);
  if (!year || !month) throw new Error(`Invalid start date: ${startDate}`);
  const monthCount = PERIOD_MONTHS[period];
  // Day 0 of (startMonth + monthCount) = last day of (startMonth + monthCount - 1)
  const endDate = new Date(Date.UTC(year, month - 1 + monthCount, 0));
  return formatYmd(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth() + 1,
    endDate.getUTCDate(),
  );
}
