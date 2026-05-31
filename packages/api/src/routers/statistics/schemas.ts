import { z } from "zod";

const monthKey = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM");

export const timelineInput = z.object({
  startMonth: monthKey.optional(),
  endMonth: monthKey.optional(),
  groupBy: z.enum(["month", "quarter", "year"]).default("month"),
});

export const memberMapInput = z.object({
  includeActive: z.boolean().default(true),
  includeCancelledButActive: z.boolean().default(true),
  includeCancelled: z.boolean().default(false),
});
