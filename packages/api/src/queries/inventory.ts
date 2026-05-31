import { db, inArray } from "@matdesk/db";
import {
  inventoryProductAttribute,
  inventoryProductAttributeValue,
  inventoryVariant,
} from "@matdesk/db/schema";

import type { VariantOption } from "../domain/inventory/attributes";

/** Fetch a product by id within an organization. Returns `undefined` if missing —
 *  callers decide how to handle (typically throw `inventory.PRODUCT_NOT_FOUND`). */
export async function getProductById(productId: string, organizationId: string) {
  return db.query.inventoryProduct.findFirst({
    where: (p, { and, eq }) =>
      and(eq(p.id, productId), eq(p.organizationId, organizationId)),
  });
}

export type ProductAttribute = {
  id: string;
  name: string;
  position: number;
  values: string[];
};

export type ProductVariant = {
  id: string;
  quantity: number;
  options: VariantOption[];
  updatedAt: Date;
};

export type ProductDetails = {
  attributesByProductId: Map<string, ProductAttribute[]>;
  variantsByProductId: Map<string, ProductVariant[]>;
};

/**
 * Bulk-load attributes (with their ordered values) and variants for a set of
 * products in three queries. Shared by `list` and `get` so the assembly logic
 * lives in one place and there's no N+1.
 */
export async function loadProductDetails(
  productIds: string[],
): Promise<ProductDetails> {
  const attributesByProductId = new Map<string, ProductAttribute[]>();
  const variantsByProductId = new Map<string, ProductVariant[]>();

  if (productIds.length === 0) {
    return { attributesByProductId, variantsByProductId };
  }

  const attributeRows = await db
    .select({
      id: inventoryProductAttribute.id,
      productId: inventoryProductAttribute.productId,
      name: inventoryProductAttribute.name,
      position: inventoryProductAttribute.position,
    })
    .from(inventoryProductAttribute)
    .where(inArray(inventoryProductAttribute.productId, productIds));

  const attributeIds = attributeRows.map((attribute) => attribute.id);

  const valueRows = attributeIds.length
    ? await db
        .select({
          attributeId: inventoryProductAttributeValue.attributeId,
          value: inventoryProductAttributeValue.value,
          position: inventoryProductAttributeValue.position,
        })
        .from(inventoryProductAttributeValue)
        .where(inArray(inventoryProductAttributeValue.attributeId, attributeIds))
    : [];

  const variantRows = await db
    .select({
      id: inventoryVariant.id,
      productId: inventoryVariant.productId,
      quantity: inventoryVariant.quantity,
      options: inventoryVariant.options,
      updatedAt: inventoryVariant.updatedAt,
    })
    .from(inventoryVariant)
    .where(inArray(inventoryVariant.productId, productIds));

  const valuesByAttributeId = new Map<
    string,
    Array<{ value: string; position: number }>
  >();
  for (const row of valueRows) {
    const current = valuesByAttributeId.get(row.attributeId) ?? [];
    current.push({ value: row.value, position: row.position });
    valuesByAttributeId.set(row.attributeId, current);
  }

  for (const row of attributeRows) {
    const current = attributesByProductId.get(row.productId) ?? [];
    const values = (valuesByAttributeId.get(row.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((value) => value.value);
    current.push({
      id: row.id,
      name: row.name,
      position: row.position,
      values,
    });
    attributesByProductId.set(row.productId, current);
  }

  // Keep attribute ordering deterministic for callers.
  for (const [productId, attributes] of attributesByProductId) {
    attributesByProductId.set(
      productId,
      attributes.sort((a, b) => a.position - b.position),
    );
  }

  for (const row of variantRows) {
    const current = variantsByProductId.get(row.productId) ?? [];
    current.push({
      id: row.id,
      quantity: row.quantity,
      options: row.options,
      updatedAt: row.updatedAt,
    });
    variantsByProductId.set(row.productId, current);
  }

  return { attributesByProductId, variantsByProductId };
}
