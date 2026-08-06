import { createProduct } from "./create";
import { deleteProduct } from "./delete";
import { getProduct } from "./get";
import { listProducts } from "./list";
import { updateProduct } from "./update";
import { updateVariantQuantities } from "./update-variant-quantities";
import { updateVariantQuantity } from "./update-variant-quantity";

export const inventoryRouter = {
  list: listProducts,
  get: getProduct,
  create: createProduct,
  update: updateProduct,
  delete: deleteProduct,
  updateVariantQuantity,
  updateVariantQuantities,
};
