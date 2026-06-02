import { z } from "zod";

import { parseYmd } from "../../domain/billing/dates";

export const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date (YYYY-MM-DD)")
  .refine((v) => parseYmd(v) !== null, "Must be a real calendar date");

export const monthStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-01$/, "Must be the 1st of a month (YYYY-MM-01)")
  .refine((v) => parseYmd(v) !== null, "Must be a real month");

export const invoiceStatusSchema = z.enum(["draft", "finalized", "void"]);
export const creditGrantTypeSchema = z.enum(["money", "billing_cycles"]);

export const idInput = z.object({ id: z.uuid() });
