import { and, db, eq } from "@matdesk/db";
import { inventoryProduct } from "@matdesk/db/schema";

import { inventoryErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { productIdInput } from "./schemas";

export const deleteProduct = orgProcedure
  .meta({ cost: 5 })
  .use(requirePermission({ inventory: ["delete"] }))
  .input(productIdInput)
  .handler(async ({ input, context }) => {
    // Attributes, values, and variants cascade off the product row.
    const [deleted] = await db
      .delete(inventoryProduct)
      .where(
        and(
          eq(inventoryProduct.id, input.productId),
          eq(inventoryProduct.organizationId, context.organizationId),
        ),
      )
      .returning({ id: inventoryProduct.id, name: inventoryProduct.name });

    if (!deleted) {
      throw inventoryErrors.PRODUCT_NOT_FOUND({
        internal: {
          productId: input.productId,
          organizationId: context.organizationId,
        },
      });
    }

    context.log?.set({
      data: { product: { id: deleted.id, name: deleted.name } },
    });
    return { id: deleted.id };
  })
  .route({ method: "DELETE", path: "/inventory/products/:productId" });
