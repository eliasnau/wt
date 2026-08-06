import { and, db, eq } from "@matdesk/db";
import { inventoryProduct } from "@matdesk/db/schema";
import { z } from "zod";

import { normalizeAttributes } from "../../domain/inventory/attributes";
import { inventoryErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import {
  getProductDefinition,
  replaceProductDefinition,
  syncProductVariants,
} from "./sync";
import { productAttributesSchema } from "./schemas";

const input = z.object({
  productId: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(140),
  description: z.string().trim().max(2000).optional(),
  attributes: productAttributesSchema,
});

export const updateProduct = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ inventory: ["update"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const normalized = normalizeAttributes(input.attributes);
    if (!normalized.ok) {
      throw inventoryErrors.DUPLICATE_ATTRIBUTE_NAME({
        internal: { duplicateName: normalized.duplicateName },
      });
    }
    const attributes = normalized.attributes;

    await db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: inventoryProduct.id })
        .from(inventoryProduct)
        .where(
          and(
            eq(inventoryProduct.id, input.productId),
            eq(inventoryProduct.organizationId, context.organizationId),
          ),
        )
        .limit(1);

      if (!product) {
        throw inventoryErrors.PRODUCT_NOT_FOUND({
          internal: {
            productId: input.productId,
            organizationId: context.organizationId,
          },
        });
      }

      // Capture the old shape before replacing it so stock can follow renamed
      // values across the sync.
      const previousAttributes = await getProductDefinition(tx, product.id);

      await tx
        .update(inventoryProduct)
        .set({ name: input.name, description: input.description })
        .where(eq(inventoryProduct.id, product.id));

      await replaceProductDefinition(tx, product.id, attributes);
      await syncProductVariants(tx, product.id, previousAttributes, attributes);
    });

    context.log?.set({
      data: { product: { id: input.productId, name: input.name } },
    });
    return { id: input.productId };
  })
  .route({ method: "PATCH", path: "/inventory/products/:productId" });
