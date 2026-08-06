/**
 * Pure yearly-fee cycle logic.
 *
 * The yearly fee is charged once per "cycle". Two modes:
 *   - `january`    → calendar-year cycle; fee triggers in January; deduped by year.
 *   - `anniversary`→ 12-month window anchored at the contract's start month; fee
 *                    triggers in the contract's start month; deduped by a cycle key.
 *
 * `yearlyCycleKey` gives anniversary cycles a stable identity even when the
 * window straddles a year boundary (e.g. a March-anchored contract: Mar 2026 …
 * Feb 2027 all belong to cycle "2026-03").
 */

import { monthNumber, yearNumber } from "./dates";

export type YearlyFeeMode = "january" | "anniversary";

/**
 * Cycle key for an anniversary-mode month. A month at or after the start month
 * belongs to that year's cycle; a month before it belongs to the *previous*
 * year's cycle (the window opened the prior anniversary).
 */
export function yearlyCycleKey(monthStart: string, contractStartDate: string): string {
  const month = monthStart.slice(5, 7);
  const startMonth = contractStartDate.slice(5, 7);
  const year = yearNumber(monthStart);
  return month >= startMonth ? `${year}-${startMonth}` : `${year - 1}-${startMonth}`;
}

/**
 * The dedupe key for a month under the contract's mode. January mode dedupes by
 * calendar year; anniversary mode by the anniversary cycle key. Used both to
 * seed "already billed" cycles from existing invoice lines and to mark a cycle
 * consumed during a generation run.
 */
export function cycleKeyForMonth(
  monthStart: string,
  contract: { yearlyFeeMode: string; startDate: string },
): string {
  if (contract.yearlyFeeMode === "anniversary") {
    return yearlyCycleKey(monthStart, contract.startDate);
  }
  return String(yearNumber(monthStart));
}

/** Whether `monthStart` is the month in which the yearly fee triggers. */
export function isYearlyTriggerMonth(
  monthStart: string,
  contract: { yearlyFeeMode: string; startDate: string },
): boolean {
  if (contract.yearlyFeeMode === "anniversary") {
    return monthNumber(monthStart) === monthNumber(contract.startDate);
  }
  return monthNumber(monthStart) === 1;
}
