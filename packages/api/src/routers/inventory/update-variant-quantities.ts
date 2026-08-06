import { db, eq, inArray } from "@matdesk/db";
import { inventoryProduct, inventoryVariant } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { inventoryErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

const input = z.object({
  productId: z.uuid(),
  updates: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(500),
});

export const updateVariantQuantities = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ inventory: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    // Last write wins if the same variant appears twice in the payload.
    const updatesByVariantId = new Map(
      input.updates.map((update) => [update.variantId, update.quantity]),
    );
    const variantIds = Array.from(updatesByVariantId.keys());

    const variants = await db
      .select({
        id: inventoryVariant.id,
        productId: inventoryVariant.productId,
        organizationId: inventoryProduct.organizationId,
      })
      .from(inventoryVariant)
      .innerJoin(
        inventoryProduct,
        eq(inventoryProduct.id, inventoryVariant.productId),
      )
      .where(inArray(inventoryVariant.id, variantIds));

    const authorizedVariantIds = variants
      .filter(
        (variant) =>
          variant.productId === input.productId &&
          variant.organizationId === context.organizationId,
      )
      .map((variant) => variant.id);

    // Every requested variant must belong to this product + org, or we reject
    // the whole batch (no partial writes).
    if (authorizedVariantIds.length !== variantIds.length) {
      throw inventoryErrors.VARIANT_NOT_FOUND({
        internal: {
          productId: input.productId,
          requested: variantIds.length,
          authorized: authorizedVariantIds.length,
        },
      });
    }

    const updated = await db.transaction(async (tx) => {
      const results: Array<{ id: string; quantity: number }> = [];

      for (const variantId of authorizedVariantIds) {
        const quantity = updatesByVariantId.get(variantId);
        if (quantity === undefined) continue;

        const [row] = await tx
          .update(inventoryVariant)
          .set({ quantity })
          .where(eq(inventoryVariant.id, variantId))
          .returning({
            id: inventoryVariant.id,
            quantity: inventoryVariant.quantity,
          });

        if (!row) {
          throw createError({
            message: "Couldn't update variant quantity",
            status: 500,
            internal: { reason: "UPDATE inventory_variant returned no row", variantId },
          });
        }

        results.push(row);
      }

      return results;
    });

    context.log?.set({
      data: { product: { id: input.productId }, query: { resultCount: updated.length } },
    });
    return { updated };
  })
  .route({
    method: "PATCH",
    path: "/inventory/products/:productId/variant-quantities",
  });
