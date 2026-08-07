import { z } from "zod";

import { databaseIdSchema } from "../../schemas";

export const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const monthStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-01$/, "Must be the 1st day of a month (YYYY-MM-01)");

/** YMD or omitted. Empty string is treated as omitted. */
export const optionalYmdSchema = z
  .union([ymdSchema, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

/** Email or omitted. Empty string is treated as omitted (forms submit ""). */
export const optionalEmail = z
  .union([z.email("Invalid email address"), z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

/** Phone or omitted. Empty string is treated as omitted. */
export const optionalPhone = z
  .string()
  .trim()
  .max(255)
  .optional()
  .transform((v) => (v ? v : undefined));

export const ibanSchema = z.string().trim().min(1, "IBAN is required").max(34);

/** BIC: 8 or 11 alphanumeric characters (SWIFT spec). */
export const bicSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/, "BIC must be 8 or 11 alphanumeric chars");

/** German postal address. Used in create/update/self-registration. */
export const addressSchema = z.object({
  street: z.string().trim().min(1, "Street is required").max(255),
  city: z.string().trim().min(1, "City is required").max(255),
  state: z.string().trim().min(1, "State is required").max(255),
  postalCode: z.string().trim().min(1, "Postal code is required").max(255),
  country: z.string().trim().min(1, "Country is required").max(255),
});

export const memberIdInput = z.object({ memberId: databaseIdSchema });

export const initialPeriodSchema = z.enum(["monthly", "half_yearly", "yearly"]);
export const yearlyFeeModeSchema = z.enum(["january", "anniversary"]);
