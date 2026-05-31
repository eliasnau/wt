/**
 * Pure attribute normalization for inventory products.
 *
 * A product carries an ordered list of attributes (e.g. "Größe", "Farbe"),
 * each with an ordered list of values. Raw input from the client is messy:
 * stray whitespace, casing differences, duplicates. These helpers clean it up
 * deterministically so variant generation downstream is stable.
 *
 * No DB access — this layer is unit-tested in isolation.
 */

export type NormalizedAttribute = {
  name: string;
  values: string[];
};

export type VariantOption = {
  attributeName: string;
  value: string;
};

/** Result of {@link normalizeAttributes} — either the cleaned list or the first
 *  duplicate attribute name found (caller maps to a cataloged error). */
export type NormalizeAttributesResult =
  | { ok: true; attributes: NormalizedAttribute[] }
  | { ok: false; duplicateName: string };

/**
 * Trim + collapse internal whitespace, then drop case-insensitive duplicates
 * while preserving first-seen order and the original (trimmed) casing.
 */
export function dedupeValues(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

/**
 * Normalize a raw attribute list: trim names, dedupe values, drop empties.
 * Attributes that end up with no name or no values are skipped entirely.
 * A case-insensitive duplicate attribute name is a hard error.
 */
export function normalizeAttributes(
  attributes: Array<{ name: string; values: string[] }>,
): NormalizeAttributesResult {
  const seenNames = new Set<string>();
  const normalized: NormalizedAttribute[] = [];

  for (const attribute of attributes) {
    const name = attribute.name.trim();
    const values = dedupeValues(attribute.values);
    if (!name || values.length === 0) continue;

    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) {
      return { ok: false, duplicateName: name };
    }

    seenNames.add(nameKey);
    normalized.push({ name, values });
  }

  return { ok: true, attributes: normalized };
}
