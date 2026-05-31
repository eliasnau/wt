/**
 * Pure variant combinatorics.
 *
 * Given a product's normalized attributes, we materialize one variant per
 * combination (the cartesian product of all attribute values). Each variant
 * gets a stable `combinationKey` so we can match it across edits, plus a
 * positional `tuple` used to carry stock quantities through attribute renames
 * (see `syncProductVariants`).
 *
 * No DB access — unit-tested in isolation.
 */

import type { NormalizedAttribute, VariantOption } from "./attributes";

/** Canonical, case-insensitive form of a key fragment (attribute name or value). */
export function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Stable, order-sensitive identity for a variant's selected options.
 * Products with no attributes collapse to a single `__default__` variant.
 */
export function getCombinationKey(options: VariantOption[]): string {
  if (options.length === 0) {
    return "__default__";
  }

  return options
    .map(
      (option) =>
        `${normalizeKeyPart(option.attributeName)}=${normalizeKeyPart(option.value)}`,
    )
    .join("|");
}

/**
 * Positional fingerprint of a variant relative to a given attribute set:
 * the index of each selected value within its attribute's value list, joined.
 *
 * Renaming a value (e.g. "rot" → "Rot") changes the `combinationKey` but NOT
 * the tuple, so stock can follow the variant across a rename. Returns `null`
 * if the variant doesn't fit the supplied attributes (stale combination).
 */
export function getCombinationTuple(
  options: VariantOption[],
  attributes: NormalizedAttribute[],
): string | null {
  if (attributes.length === 0) {
    return "__default__";
  }

  const selectedByAttribute = new Map(
    options.map((option) => [
      normalizeKeyPart(option.attributeName),
      option.value,
    ]),
  );

  const tuple: number[] = [];

  for (const attribute of attributes) {
    const attributeKey = normalizeKeyPart(attribute.name);
    const selectedValue = selectedByAttribute.get(attributeKey);
    if (!selectedValue) {
      return null;
    }

    const valueIndex = attribute.values.findIndex(
      (value) => normalizeKeyPart(value) === normalizeKeyPart(selectedValue),
    );
    if (valueIndex === -1) {
      return null;
    }

    tuple.push(valueIndex);
  }

  return tuple.join("|");
}

/** Cartesian product of all attribute values → one entry per variant. */
export function buildVariantCombinations(
  attributes: NormalizedAttribute[],
): Array<{ combinationKey: string; options: VariantOption[] }> {
  if (attributes.length === 0) {
    return [{ combinationKey: "__default__", options: [] }];
  }

  for (const attribute of attributes) {
    if (attribute.values.length === 0) {
      return [];
    }
  }

  let combinations: VariantOption[][] = [[]];

  for (const attribute of attributes) {
    const next: VariantOption[][] = [];
    for (const base of combinations) {
      for (const value of attribute.values) {
        next.push([...base, { attributeName: attribute.name, value }]);
      }
    }
    combinations = next;
  }

  return combinations.map((options) => ({
    combinationKey: getCombinationKey(options),
    options,
  }));
}
