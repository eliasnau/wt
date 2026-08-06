import { z } from "zod";

const opaqueIdSchema = z.string().trim().min(1);

export const eventIdInput = z.object({ eventId: opaqueIdSchema });
export const participantIdInput = z.object({ participantId: opaqueIdSchema });
export const eventStatusSchema = z.enum(["registered", "attended", "no_show", "cancelled"]);
export const eventDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const eventTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const eventFieldsSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(2000).nullish(),
    date: eventDateSchema,
    startTime: eventTimeSchema.nullish(),
    endTime: eventTimeSchema.nullish(),
    location: z.string().trim().max(500).nullish(),
    priceCents: z.number().int().nonnegative().nullish(),
    capacity: z.number().int().nonnegative().nullish(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.startTime) !== Boolean(value.endTime)) {
      context.addIssue({
        code: "custom",
        message: "Start and end time must be provided together",
        path: value.startTime ? ["endTime"] : ["startTime"],
      });
    } else if (value.startTime && value.endTime && value.endTime <= value.startTime) {
      context.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }
  });
