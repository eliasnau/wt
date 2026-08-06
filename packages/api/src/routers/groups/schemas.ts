import { z } from "zod";

export const groupColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex value")
  .transform((v) => v.toLowerCase());

export const groupIdInput = z.object({
  id: z.uuid(),
});
