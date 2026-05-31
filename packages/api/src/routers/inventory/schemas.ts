import { z } from "zod";

/** One attribute (e.g. "Größe") with its candidate values. Normalized + deduped
 *  in the domain layer; this only enforces shape and bounds. */
export const attributeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  values: z.array(z.string().trim().min(1).max(80)).min(1),
});

/** The attributes payload shared by create + update. Capped at 8 attributes —
 *  the cartesian product of variants grows fast. */
export const productAttributesSchema = z
  .array(attributeSchema)
  .max(8)
  .default([]);

export const productIdInput = z.object({
  productId: z.uuid(),
});

export const variantIdInput = z.object({
  variantId: z.uuid(),
});
