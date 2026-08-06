import { inventoryErrors } from "../../errors";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { getProductById, loadProductDetails } from "../../queries/inventory";
import { productIdInput } from "./schemas";

export const getProduct = orgProcedure
  .meta({ cost: 1 })
  .use(requirePermission({ inventory: ["view"] }))
  .input(productIdInput)
  .handler(async ({ input, context }) => {
    const product = await getProductById(
      input.productId,
      context.organizationId,
    );
    if (!product) {
      throw inventoryErrors.PRODUCT_NOT_FOUND({
        internal: {
          productId: input.productId,
          organizationId: context.organizationId,
        },
      });
    }

    const { attributesByProductId, variantsByProductId } =
      await loadProductDetails([product.id]);

    context.log?.set({ data: { product: { id: product.id } } });

    return {
      ...product,
      attributes: attributesByProductId.get(product.id) ?? [],
      variants: variantsByProductId.get(product.id) ?? [],
    };
  })
  .route({ method: "GET", path: "/inventory/products/:productId" });
