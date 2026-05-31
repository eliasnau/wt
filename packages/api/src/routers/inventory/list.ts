import { and, count, db, desc, eq, ilike } from "@matdesk/db";
import { inventoryProduct } from "@matdesk/db/schema";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { loadProductDetails } from "../../queries/inventory";

const input = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const listProducts = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ inventory: ["view"] }))
  .input(input)
  .handler(async ({ input, context }) => {
    const { page, limit } = input;

    const where = input.search
      ? and(
          eq(inventoryProduct.organizationId, context.organizationId),
          ilike(inventoryProduct.name, `%${input.search}%`),
        )
      : eq(inventoryProduct.organizationId, context.organizationId);

    const [{ count: totalCount = 0 } = { count: 0 }] = await db
      .select({ count: count() })
      .from(inventoryProduct)
      .where(where);

    if (totalCount === 0) {
      context.log?.set({ data: { query: { resultCount: 0 } } });
      return {
        data: [],
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const totalPages = Math.ceil(totalCount / limit);

    const products = await db
      .select({
        id: inventoryProduct.id,
        name: inventoryProduct.name,
        description: inventoryProduct.description,
        isActive: inventoryProduct.isActive,
        createdAt: inventoryProduct.createdAt,
        updatedAt: inventoryProduct.updatedAt,
      })
      .from(inventoryProduct)
      .where(where)
      .orderBy(desc(inventoryProduct.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const { attributesByProductId, variantsByProductId } =
      await loadProductDetails(products.map((product) => product.id));

    context.log?.set({ data: { query: { resultCount: products.length } } });

    return {
      data: products.map((product) => ({
        ...product,
        attributes: attributesByProductId.get(product.id) ?? [],
        variants: variantsByProductId.get(product.id) ?? [],
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  })
  .route({ method: "GET", path: "/inventory/products" });
