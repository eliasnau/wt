export type ProductDefinition = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  attributes: Array<{ id: string; name: string; values: string[] }>;
  variants: Array<{
    id: string;
    quantity: number;
    options: Array<{ attributeName: string; value: string }>;
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
