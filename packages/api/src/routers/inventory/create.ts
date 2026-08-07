import { transactionDb } from "@matdesk/db";
import { inventoryProduct } from "@matdesk/db/schema";
import { createError } from "evlog";
import { z } from "zod";

import { normalizeAttributes } from "../../domain/inventory/attributes";
import { inventoryErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { replaceProductDefinition, syncProductVariants } from "./sync";
import { productAttributesSchema } from "./schemas";

const input = z.object({
  name: z.string().trim().min(1, "Name is required").max(140),
  description: z.string().trim().max(2000).optional(),
  attributes: productAttributesSchema,
});

export const createProduct = orgProcedure
  .meta({ cost: 10 })
  .use(requirePermission({ inventory: ["create"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const normalized = normalizeAttributes(input.attributes);
    if (!normalized.ok) {
      throw inventoryErrors.DUPLICATE_ATTRIBUTE_NAME({
        internal: { duplicateName: normalized.duplicateName },
      });
    }
    const attributes = normalized.attributes;

    const created = await transactionDb.transaction(async (tx) => {
      const [product] = await tx
        .insert(inventoryProduct)
        .values({
          organizationId: context.organizationId,
          name: input.name,
          description: input.description,
        })
        .returning({ id: inventoryProduct.id, name: inventoryProduct.name });

      if (!product) {
        throw createError({
          message: "Couldn't create product",
          status: 500,
          internal: { reason: "INSERT inventory_product returned no row" },
        });
      }

      await replaceProductDefinition(tx, product.id, attributes);
      await syncProductVariants(tx, product.id, attributes, attributes);

      return product;
    });

    context.log?.set({
      data: { product: { id: created.id, name: created.name } },
    });
    return { id: created.id };
  })
  .route({ method: "POST", path: "/inventory/products" });
