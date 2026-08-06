import { creditGrantType } from "@matdesk/db/schema";
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
// Derived from the pg enum so the DB constraint and the input validator can
// never drift. (`invoice.status` above is still a bare text column — when it
// becomes an enum too, give it the same treatment.)
export const creditGrantTypeSchema = z.enum(creditGrantType.enumValues);

export const idInput = z.object({ id: z.uuid() });
