import { db, eq } from "@matdesk/db";
import { inventoryProduct, inventoryVariant } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { inventoryErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";

const input = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(0),
});

export const updateVariantQuantity = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ inventory: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    // Variant carries no org column — verify ownership through its product.
    const [variant] = await db
      .select({
        id: inventoryVariant.id,
        organizationId: inventoryProduct.organizationId,
      })
      .from(inventoryVariant)
      .innerJoin(
        inventoryProduct,
        eq(inventoryProduct.id, inventoryVariant.productId),
      )
      .where(eq(inventoryVariant.id, input.variantId))
      .limit(1);

    if (!variant || variant.organizationId !== context.organizationId) {
      throw inventoryErrors.VARIANT_NOT_FOUND({
        internal: {
          variantId: input.variantId,
          organizationId: context.organizationId,
        },
      });
    }

    const [updated] = await db
      .update(inventoryVariant)
      .set({ quantity: input.quantity })
      .where(eq(inventoryVariant.id, input.variantId))
      .returning({
        id: inventoryVariant.id,
        quantity: inventoryVariant.quantity,
      });

    if (!updated) {
      throw createError({
        message: "Couldn't update variant quantity",
        status: 500,
        internal: { reason: "UPDATE inventory_variant returned no row" },
      });
    }

    context.log?.set({
      data: { variant: { id: updated.id, quantity: updated.quantity } },
    });
    return updated;
  })
  .route({ method: "PATCH", path: "/inventory/variants/:variantId/quantity" });
