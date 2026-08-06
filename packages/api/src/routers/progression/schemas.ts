import { z } from "zod";

export const progressionIdSchema = z.string().trim().min(1);
export const progressionDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const progressionModeSchema = z.enum(["sequential", "collection"]);
export const progressionColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .transform((value) => value.toLowerCase());
