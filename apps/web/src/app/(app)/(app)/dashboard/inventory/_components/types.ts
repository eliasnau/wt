export type ProductDefinition = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  attributes: Array<{ id: string; name: string; values: string[] }>;
  variants: Array<{
    id: string;
    quantity: number;
    options: Array<{ attributeName: string; value: string }>;
    updatedAt?: string | Date;
  }>;
};

export type EditableValue = {
  id: string;
  value: string;
};

export type EditableAttribute = {
  id: string;
  name: string;
  values: EditableValue[];
};

export function createUiId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyAttribute(): EditableAttribute {
  return {
    id: createUiId(),
    name: "",
    values: [{ id: createUiId(), value: "" }],
  };
}


export function toEditableAttributes(
  definition: ProductDefinition[],
): EditableAttribute[] {
  if (definition.length === 0) {
    return [];
  }

  return definition.map((attribute) => ({
    id: createUiId(),
    name: attribute.name,
    values:
      attribute.values.length > 0
        ? attribute.values.map((value) => ({ id: createUiId(), value }))
        : [{ id: createUiId(), value: "" }],
  }));
}

function dedupeValues(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const rawValue of values) {
    const value = rawValue.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }

  return output;
}

export function toProductDefinition(
  attributes: EditableAttribute[],
): ProductDefinition[] {
  const normalized = attributes
    .map((attribute) => ({
      name: attribute.name.trim(),
      values: dedupeValues(attribute.values.map((value) => value.value)),
    }))
    .filter((attribute) => attribute.name.length > 0)
    .filter((attribute) => attribute.values.length > 0);

  const uniqueNames = new Set<string>();
  for (const attribute of normalized) {
    const key = attribute.name.toLowerCase();
    if (uniqueNames.has(key)) {
      throw new Error(`Attributname doppelt: ${attribute.name}`);
    }
    uniqueNames.add(key);
  }

  return normalized;
}

export function getTotalStock(product: Product) {
  return product.variants.reduce((sum, v) => sum + v.quantity, 0);
}

/**
 * Returns variants sorted deterministically based on the position of each
 * option value within its attribute definition. This keeps the rendered
 * order stable across refetches (the DB returns rows in arbitrary order).
 */
export function sortVariants(
  variants: Product["variants"],
  attributes: Product["attributes"],
): Product["variants"] {
  if (attributes.length === 0) return variants;

  const positionByKey = new Map<string, number>();
  for (const attr of attributes) {
    attr.values.forEach((value, idx) => {
      positionByKey.set(`${attr.name}\u0000${value}`, idx);
    });
  }

  function tupleOf(variant: Product["variants"][number]): number[] {
    const tuple: number[] = [];
    for (const attr of attributes) {
      const opt = variant.options.find((o) => o.attributeName === attr.name);
      tuple.push(
        opt
          ? (positionByKey.get(`${attr.name}\u0000${opt.value}`) ?? 9999)
          : 9999,
      );
    }
    return tuple;
  }

  return [...variants].sort((a, b) => {
    const ta = tupleOf(a);
    const tb = tupleOf(b);
    for (let i = 0; i < ta.length; i++) {
      const av = ta[i] ?? 0;
      const bv = tb[i] ?? 0;
      if (av !== bv) return av - bv;
    }
    return 0;
  });
}

export type SortMode = "default" | "stock-asc" | "stock-desc" | "label-asc";

export const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "default", label: "Standard" },
  { value: "stock-asc", label: "Bestand ↑" },
  { value: "stock-desc", label: "Bestand ↓" },
  { value: "label-asc", label: "Name A–Z" },
];

function variantLabel(variant: Product["variants"][number]) {
  return variant.options
    .map((o) => o.value)
    .join(" · ")
    .toLowerCase();
}

/**
 * Apply a user-selected sort on top of an already-ordered variant list.
 * "default" preserves the incoming order (typically the attribute-based
 * order from {@link sortVariants}).
 */
export function applySortMode(
  variants: Product["variants"],
  mode: SortMode,
): Product["variants"] {
  if (mode === "default") return variants;
  const copy = [...variants];
  switch (mode) {
    case "stock-asc":
      return copy.sort((a, b) => a.quantity - b.quantity);
    case "stock-desc":
      return copy.sort((a, b) => b.quantity - a.quantity);
    case "label-asc":
      return copy.sort((a, b) =>
        variantLabel(a).localeCompare(variantLabel(b)),
      );
    default:
      return variants;
  }
}

