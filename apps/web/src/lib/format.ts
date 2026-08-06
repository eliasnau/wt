/**
 * Shared display formatters. German locale throughout — matdesk is a
 * German-language product, so there's no locale switch to thread through.
 *
 * Money is integer cents everywhere in the API (see PROGRESS.md), so
 * `formatCents` is the single place that divides by 100 for display.
 */

/** Integer cents → "12,34 €". Nullish renders as an em dash, not "0,00 €" —
 *  "no value" and "zero" are different things on a member's contract. */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("de-DE", { currency: "EUR", style: "currency" });
}

/** Date or `YYYY-MM-DD` → "31.1.2026". Nullish renders as an em dash. */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("de-DE");
}

/** Today as `YYYY-MM-DD` in the *local* zone, for lexicographic comparison
 *  against the API's ymd date strings. Deliberately not `toISOString()`, which
 *  yields the UTC date and is a day behind after 23:00 Berlin time. */
export function todayYmd(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
