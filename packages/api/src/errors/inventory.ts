import { defineErrorCatalog } from "evlog";

export const inventoryErrors = defineErrorCatalog("inventory", {
  PRODUCT_NOT_FOUND: {
    status: 404,
    message: "Product not found",
    why: "The requested product doesn't exist or belongs to another organization.",
    fix: "Refresh the list or pick a different product.",
  },
  VARIANT_NOT_FOUND: {
    status: 404,
    message: "Variant not found",
    why: "One or more variants don't exist or belong to another product/organization.",
    fix: "Reload the product and retry with current variants.",
  },
  DUPLICATE_ATTRIBUTE_NAME: {
    status: 400,
    message: "Duplicate attribute name",
    why: "An attribute name was used more than once on the same product.",
    fix: "Give each attribute a unique name, then save again.",
  },
});
