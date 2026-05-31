import { db, eq, inArray } from "@matdesk/db";
import {
  inventoryProductAttribute,
  inventoryProductAttributeValue,
  inventoryVariant,
} from "@matdesk/db/schema";
import { createError } from "evlog";

import type { NormalizedAttribute } from "../../domain/inventory/attributes";
import {
  buildVariantCombinations,
  getCombinationTuple,
} from "../../domain/inventory/variants";

/** Transaction handle, derived from the single `db` client. */
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Read a product's current attribute definition (ordered attributes, each with
 * ordered values) inside a transaction. Used by `update` to know the *previous*
 * shape before applying the new one, so stock can follow renamed values.
 */
export async function getProductDefinition(
  tx: DbTx,
  productId: string,
): Promise<NormalizedAttribute[]> {
  const attributeRows = await tx
    .select({
      id: inventoryProductAttribute.id,
      name: inventoryProductAttribute.name,
      position: inventoryProductAttribute.position,
    })
    .from(inventoryProductAttribute)
    .where(eq(inventoryProductAttribute.productId, productId));

  if (attributeRows.length === 0) {
    return [];
  }

  const attributeIds = attributeRows.map((attribute) => attribute.id);
  const valueRows = await tx
    .select({
      attributeId: inventoryProductAttributeValue.attributeId,
      value: inventoryProductAttributeValue.value,
      position: inventoryProductAttributeValue.position,
    })
    .from(inventoryProductAttributeValue)
    .where(inArray(inventoryProductAttributeValue.attributeId, attributeIds));

  const valuesByAttributeId = new Map<
    string,
    Array<{ value: string; position: number }>
  >();
  for (const valueRow of valueRows) {
    const current = valuesByAttributeId.get(valueRow.attributeId) ?? [];
    current.push({ value: valueRow.value, position: valueRow.position });
    valuesByAttributeId.set(valueRow.attributeId, current);
  }

  return attributeRows
    .sort((a, b) => a.position - b.position)
    .map((attribute) => ({
      name: attribute.name,
      values: (valuesByAttributeId.get(attribute.id) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((value) => value.value),
    }));
}

/**
 * Replace a product's entire attribute/value definition: wipe the old rows and
 * re-insert in `position` order. The cascade on `inventory_product_attribute`
 * drops the dependent value rows.
 */
export async function replaceProductDefinition(
  tx: DbTx,
  productId: string,
  attributes: NormalizedAttribute[],
) {
  await tx
    .delete(inventoryProductAttribute)
    .where(eq(inventoryProductAttribute.productId, productId));

  for (const [attributeIndex, attribute] of attributes.entries()) {
    const [createdAttribute] = await tx
      .insert(inventoryProductAttribute)
      .values({
        productId,
        name: attribute.name,
        position: attributeIndex,
      })
      .returning({ id: inventoryProductAttribute.id });

    if (!createdAttribute) {
      throw createError({
        message: "Couldn't create product attribute",
        status: 500,
        internal: { reason: "INSERT inventory_product_attribute returned no row" },
      });
    }

    for (const [valueIndex, value] of attribute.values.entries()) {
      await tx.insert(inventoryProductAttributeValue).values({
        attributeId: createdAttribute.id,
        value,
        position: valueIndex,
      });
    }
  }
}

/**
 * Reconcile the materialized variant rows with the new attribute set:
 *  - existing variants matching a desired combinationKey are kept (options refreshed),
 *  - brand-new combinations are inserted, inheriting stock from a positionally
 *    equivalent old variant (so a value *rename* preserves quantity),
 *  - combinations that no longer exist are deleted.
 */
export async function syncProductVariants(
  tx: DbTx,
  productId: string,
  previousAttributes: NormalizedAttribute[],
  attributes: NormalizedAttribute[],
) {
  const desiredVariants = buildVariantCombinations(attributes);
  const existingVariants = await tx
    .select({
      id: inventoryVariant.id,
      combinationKey: inventoryVariant.combinationKey,
      options: inventoryVariant.options,
      quantity: inventoryVariant.quantity,
    })
    .from(inventoryVariant)
    .where(eq(inventoryVariant.productId, productId));

  const existingByKey = new Map(
    existingVariants.map((variant) => [variant.combinationKey, variant]),
  );
  const desiredKeys = new Set(
    desiredVariants.map((variant) => variant.combinationKey),
  );
  const existingByTuple = new Map(
    existingVariants
      .map((variant) => ({
        tuple: getCombinationTuple(variant.options, previousAttributes),
        variant,
      }))
      .filter(
        (
          item,
        ): item is {
          tuple: string;
          variant: (typeof existingVariants)[number];
        } => Boolean(item.tuple),
      )
      .map((item) => [item.tuple, item.variant] as const),
  );

  for (const variant of desiredVariants) {
    const existing = existingByKey.get(variant.combinationKey);
    if (existing) {
      await tx
        .update(inventoryVariant)
        .set({ options: variant.options })
        .where(eq(inventoryVariant.id, existing.id));
      continue;
    }

    const tuple = getCombinationTuple(variant.options, attributes);
    const quantityFromTuple =
      (tuple ? existingByTuple.get(tuple)?.quantity : undefined) ?? 0;

    await tx.insert(inventoryVariant).values({
      productId,
      combinationKey: variant.combinationKey,
      options: variant.options,
      quantity: quantityFromTuple,
    });
  }

  const obsoleteVariantIds = existingVariants
    .filter((variant) => !desiredKeys.has(variant.combinationKey))
    .map((variant) => variant.id);

  if (obsoleteVariantIds.length > 0) {
    await tx
      .delete(inventoryVariant)
      .where(inArray(inventoryVariant.id, obsoleteVariantIds));
  }
}
