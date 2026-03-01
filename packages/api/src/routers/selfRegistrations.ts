import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { DB } from "@repo/db/functions";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { loadSepaModule } from "../lib/sepa";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

const decimalSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);
const codeSchema = z
  .string()
  .trim()
  .min(4)
  .max(80)
  .regex(/^[a-z0-9-]+$/)
  .transform((value) => value.toLowerCase());

const configGroupSchema = z.object({
  groupId: z.string().min(1),
  monthlyFee: decimalSchema,
  schedule: z.string().max(255).optional(),
});

const createSelfRegistrationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  billingCycle: z.enum(["monthly", "half_yearly", "yearly"]).default("monthly"),
  joiningFeeAmount: decimalSchema.optional(),
  yearlyFeeAmount: decimalSchema.optional(),
  contractStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)")
    .optional(),
  notes: z.string().max(2000).optional(),
  groups: z.array(configGroupSchema).min(1),
});

const updateSelfRegistrationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  billingCycle: z.enum(["monthly", "half_yearly", "yearly"]).optional(),
  joiningFeeAmount: decimalSchema.optional(),
  yearlyFeeAmount: decimalSchema.optional(),
  contractStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-01$/, "Must be 1st day of month (YYYY-MM-01)")
    .optional(),
  notes: z.string().max(2000).optional(),
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(255).optional(),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)")
    .optional(),
  street: z.string().min(1).max(255).optional(),
  city: z.string().min(1).max(255).optional(),
  state: z.string().min(1).max(255).optional(),
  postalCode: z.string().min(1).max(32).optional(),
  country: z.string().min(1).max(255).optional(),
  accountHolder: z.string().min(1).max(255).optional(),
  iban: z.string().min(1).max(64).optional(),
  bic: z.string().min(1).max(11).optional(),
  submitted: z.boolean().optional(),
  groups: z.array(configGroupSchema).min(1).optional(),
});

const getByIdSchema = z.object({
  id: z.string().min(1),
});

const getByCodeSchema = z.object({
  code: codeSchema,
});

const submitSelfRegistrationSchema = z.object({
  code: codeSchema,
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(1).max(255),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be valid date format (YYYY-MM-DD)"),
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  postalCode: z.string().min(1).max(32),
  country: z.string().min(1).max(255),
  accountHolder: z.string().min(1).max(255),
  iban: z.string().min(1).max(64),
  bic: z.string().min(1).max(11),
});

const listSubmissionsSchema = z.object({
  status: z.enum(["submitted", "created"]).optional(),
});

const updateSubmissionStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["submitted", "created"]),
});

const createMemberFromRegistrationSchema = z.object({
  id: z.string().min(1),
});

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateOnly(dateStr: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return { year, month, day };
}

function formatDateOnly(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getTodayInBerlinDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    const now = new Date();
    return formatDateOnly(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  return `${year}-${month}-${day}`;
}

function generateMandateId(): string {
  return `WT-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function calculateInitialPeriodEndDate(
  startDate: string,
  period: "monthly" | "half_yearly" | "yearly",
): string {
  const parsedStartDate = parseDateOnly(startDate);
  if (!parsedStartDate) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Invalid contract start date",
    });
  }
  const periodMonths = period === "monthly" ? 1 : period === "half_yearly" ? 6 : 12;
  const endMonthIndex = parsedStartDate.month - 1 + periodMonths - 1;
  const endYear = parsedStartDate.year + Math.floor(endMonthIndex / 12);
  const endMonth = (endMonthIndex % 12) + 1;
  const endDay = getLastDayOfMonth(endYear, endMonth);
  return formatDateOnly(endYear, endMonth, endDay);
}

function generateRandomCode(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    code += alphabet[randomIndex];
  }
  return code;
}

export const selfRegistrationsRouter = {
  list: protectedProcedure
    .use(rateLimitMiddleware(2))
    .use(requirePermission({ member: ["update"] }))
    .handler(async ({ context }) => {
      const organizationId = context.session.activeOrganizationId!;
      return DB.query.selfRegistrations.listConfigsByOrganization({
        organizationId,
      });
    })
    .route({ method: "GET", path: "/self-registrations" }),

  get: protectedProcedure
    .use(rateLimitMiddleware(2))
    .use(requirePermission({ member: ["update"] }))
    .input(getByIdSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;
      const config = await DB.query.selfRegistrations.getConfigByIdWithGroups({
        id: input.id,
      });

      if (!config || config.organizationId !== organizationId) {
        throw new ORPCError("NOT_FOUND", {
          message: "Self-registration config not found",
        });
      }

      return config;
    })
    .route({ method: "GET", path: "/self-registrations/:id" }),

  create: protectedProcedure
    .use(rateLimitMiddleware(5))
    .use(requirePermission({ member: ["update"] }))
    .input(createSelfRegistrationSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;
      let generatedCode = "";
      let isUnique = false;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        generatedCode = generateRandomCode(8);
        const existingByCode = await DB.query.selfRegistrations.getConfigByCode(
          {
            code: generatedCode,
          },
        );
        if (!existingByCode) {
          isUnique = true;
          break;
        }
      }
      if (!isUnique) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to generate unique registration code",
        });
      }

      const uniqueGroupIds = Array.from(
        new Set(input.groups.map((g) => g.groupId)),
      );
      if (uniqueGroupIds.length !== input.groups.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Duplicate groups are not allowed",
        });
      }
      const groupsFromOrg =
        await DB.query.selfRegistrations.listGroupsByIdsAndOrganization({
          organizationId,
          groupIds: uniqueGroupIds,
        });

      if (groupsFromOrg.length !== uniqueGroupIds.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "One or more groups are invalid for this organization",
        });
      }

      const groupNameById = new Map(groupsFromOrg.map((g) => [g.id, g.name]));

      return DB.mutation.selfRegistrations.createConfigWithGroups({
        organizationId,
        config: {
          name: input.name,
          code: generatedCode,
          description: input.description,
          isActive: input.isActive,
          billingCycle: input.billingCycle,
          joiningFeeAmount: input.joiningFeeAmount,
          yearlyFeeAmount: input.yearlyFeeAmount,
          contractStartDate: input.contractStartDate,
          notes: input.notes,
        },
        groups: input.groups.map((item) => ({
          groupId: item.groupId,
          groupNameSnapshot: groupNameById.get(item.groupId) || "Unknown group",
          schedule: item.schedule,
          monthlyFee: item.monthlyFee,
        })),
      });
    })
    .route({ method: "POST", path: "/self-registrations" }),

  update: protectedProcedure
    .use(rateLimitMiddleware(5))
    .use(requirePermission({ member: ["update"] }))
    .input(updateSelfRegistrationSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;

      const existing = await DB.query.selfRegistrations.getConfigById({
        id: input.id,
      });

      if (!existing || existing.organizationId !== organizationId) {
        throw new ORPCError("NOT_FOUND", {
          message: "Self-registration config not found",
        });
      }

      const updates = Object.fromEntries(
        Object.entries({
          name: input.name,
          description: input.description,
          isActive: input.isActive,
          billingCycle: input.billingCycle,
          joiningFeeAmount: input.joiningFeeAmount,
          yearlyFeeAmount: input.yearlyFeeAmount,
          contractStartDate: input.contractStartDate,
          notes: input.notes,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          birthdate: input.birthdate,
          street: input.street,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          accountHolder: input.accountHolder,
          iban: input.iban,
          bic: input.bic,
          submitted: input.submitted,
        }).filter(([, value]) => value !== undefined),
      );

      let groupsForUpdate:
        | Array<{
            groupId: string;
            groupNameSnapshot: string;
            schedule?: string;
            monthlyFee: string;
          }>
        | undefined;

      if (input.groups) {
        const uniqueGroupIds = Array.from(
          new Set(input.groups.map((g) => g.groupId)),
        );
        if (uniqueGroupIds.length !== input.groups.length) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Duplicate groups are not allowed",
          });
        }
        const groupsFromOrg =
          await DB.query.selfRegistrations.listGroupsByIdsAndOrganization({
            organizationId,
            groupIds: uniqueGroupIds,
          });

        if (groupsFromOrg.length !== uniqueGroupIds.length) {
          throw new ORPCError("BAD_REQUEST", {
            message: "One or more groups are invalid for this organization",
          });
        }

        const groupNameById = new Map(groupsFromOrg.map((g) => [g.id, g.name]));
        groupsForUpdate = input.groups.map((item) => ({
          groupId: item.groupId,
          groupNameSnapshot: groupNameById.get(item.groupId) || "Unknown group",
          schedule: item.schedule,
          monthlyFee: item.monthlyFee,
        }));
      }

      if (Object.keys(updates).length === 0 && !groupsForUpdate) {
        throw new ORPCError("BAD_REQUEST", {
          message: "No fields to update",
        });
      }

      return DB.mutation.selfRegistrations.updateConfigWithGroups({
        configId: input.id,
        updates,
        groups: groupsForUpdate,
      });
    })
    .route({ method: "PATCH", path: "/self-registrations/:id" }),

  delete: protectedProcedure
    .use(rateLimitMiddleware(5))
    .use(requirePermission({ member: ["update"] }))
    .input(getByIdSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;

      const existing = await DB.query.selfRegistrations.getConfigById({
        id: input.id,
      });

      if (!existing || existing.organizationId !== organizationId) {
        throw new ORPCError("NOT_FOUND", {
          message: "Self-registration config not found",
        });
      }

      if (existing.memberId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Registrations with a created member cannot be deleted",
        });
      }

      const deleted = await DB.mutation.selfRegistrations.deleteConfig({
        configId: input.id,
      });

      if (!deleted) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to delete self-registration config",
        });
      }

      return deleted;
    })
    .route({ method: "DELETE", path: "/self-registrations/:id" }),

  getPublicByCode: publicProcedure
    //.use(rateLimitMiddleware(5)) add ip ratelimit
    .input(getByCodeSchema)
    .handler(async ({ input }) => {
      const config =
        await DB.query.selfRegistrations.getActiveConfigByCodeWithGroups({
          code: input.code,
        });

      if (!config) {
        throw new ORPCError("NOT_FOUND", {
          message: "Registration code not found",
        });
      }

      return {
        id: config.id,
        name: config.name,
        code: config.code,
        status: config.status,
        description: config.description,
        billingCycle: config.billingCycle,
        joiningFeeAmount: config.joiningFeeAmount,
        yearlyFeeAmount: config.yearlyFeeAmount,
        contractStartDate: config.contractStartDate,
        notes: config.notes,
        groups: config.groupsSnapshot,
      };
    })
    .route({ method: "GET", path: "/self-registrations/by-code/:code" }),

  submit: publicProcedure
    // .use(rateLimitMiddleware(10)) add ip ratelimit
    .input(submitSelfRegistrationSchema)
    .handler(async ({ input }) => {
      const config =
        await DB.query.selfRegistrations.getActiveConfigByCodeWithGroups({
          code: input.code,
        });

      if (!config) {
        throw new ORPCError("NOT_FOUND", {
          message: "Registration code not found",
        });
      }

      if (config.status !== "draft") {
        throw new ORPCError("CONFLICT", {
          message: "Registration code already used",
        });
      }

      const sepa = await loadSepaModule();
      if (!sepa.validateIBAN(input.iban)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid IBAN",
        });
      }

      const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
      if (!bicRegex.test(input.bic)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid BIC",
        });
      }

      const createdSubmission =
        await DB.mutation.selfRegistrations.createSubmission({
          configId: config.id,
          submission: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            birthdate: input.birthdate,
            street: input.street,
            city: input.city,
            postalCode: input.postalCode,
            country: input.country,
            accountHolder: input.accountHolder,
            iban: input.iban,
            bic: input.bic,
          },
        });

      return {
        id: createdSubmission.id,
        status: createdSubmission.status,
        submittedAt: createdSubmission.submittedAt,
      };
    })
    .route({ method: "POST", path: "/self-registrations/submit" }),

  createMemberFromRegistration: protectedProcedure
    .use(rateLimitMiddleware(5))
    .use(requirePermission({ member: ["create"] }))
    .input(createMemberFromRegistrationSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;
      const registration = await DB.query.selfRegistrations.getConfigById({
        id: input.id,
      });

      if (!registration || registration.organizationId !== organizationId) {
        throw new ORPCError("NOT_FOUND", {
          message: "Self-registration not found",
        });
      }

      if (!registration.submitted) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Registration has not been submitted yet",
        });
      }

      if (registration.memberId) {
        throw new ORPCError("CONFLICT", {
          message: "Member was already created from this registration",
        });
      }

      const requiredFields = [
        ["firstName", registration.firstName],
        ["lastName", registration.lastName],
        ["email", registration.email],
        ["phone", registration.phone],
        ["street", registration.street],
        ["city", registration.city],
        ["state", registration.state],
        ["postalCode", registration.postalCode],
        ["country", registration.country],
        ["accountHolder", registration.accountHolder],
        ["iban", registration.iban],
        ["bic", registration.bic],
        ["contractStartDate", registration.contractStartDate],
      ] as const;

      for (const [field, value] of requiredFields) {
        if (!value || `${value}`.trim().length === 0) {
          throw new ORPCError("BAD_REQUEST", {
            message: `Missing required field: ${field}`,
          });
        }
      }

      const contractStartDate = registration.contractStartDate!;
      if (!/^\d{4}-\d{2}-01$/.test(contractStartDate)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid contract start date",
        });
      }

      const sepa = await loadSepaModule();
      if (!sepa.validateIBAN(registration.iban!)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid IBAN",
        });
      }

      const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
      if (!bicRegex.test(registration.bic!)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid BIC",
        });
      }

      const initialPeriod = registration.billingCycle as
        | "monthly"
        | "half_yearly"
        | "yearly";
      const initialPeriodEndDate = calculateInitialPeriodEndDate(
        contractStartDate,
        initialPeriod,
      );
      const nextBillingDate = contractStartDate;
      const mandateSignatureDate = getTodayInBerlinDateString();
      const newMemberId = randomBytes(16).toString("hex");

      const created = await DB.mutation.members.createMemberWithContract({
        organizationId,
        memberId: newMemberId,
        memberData: {
          firstName: registration.firstName!,
          lastName: registration.lastName!,
          email: registration.email!,
          phone: registration.phone!,
          birthdate: registration.birthdate || undefined,
          street: registration.street!,
          city: registration.city!,
          state: registration.state!,
          postalCode: registration.postalCode!,
          country: registration.country!,
          iban: registration.iban!,
          bic: registration.bic!,
          cardHolder: registration.accountHolder!,
          notes: undefined,
          guardianName: undefined,
          guardianEmail: undefined,
          guardianPhone: undefined,
        },
        contractData: {
          initialPeriod,
          startDate: contractStartDate,
          initialPeriodEndDate,
          nextBillingDate,
          mandateId: generateMandateId(),
          mandateSignatureDate,
          joiningFeeAmount: registration.joiningFeeAmount || undefined,
          yearlyFeeAmount: registration.yearlyFeeAmount || undefined,
          notes: registration.notes || undefined,
        },
      });

      const rawGroups = Array.isArray(registration.groupsSnapshot)
        ? registration.groupsSnapshot
        : [];
      for (const entry of rawGroups) {
        if (!entry || typeof entry !== "object") continue;
        const group = entry as Record<string, unknown>;
        if (typeof group.groupId !== "string") continue;
        const monthlyFee =
          typeof group.monthlyFee === "string" ? group.monthlyFee : undefined;
        await DB.mutation.groups.assignMemberToGroup({
          memberId: created.member.id,
          groupId: group.groupId,
          membershipPrice: monthlyFee,
        });
      }

      await DB.mutation.selfRegistrations.setMemberId({
        registrationId: registration.id,
        organizationId,
        memberId: created.member.id,
      });

      return {
        registrationId: registration.id,
        memberId: created.member.id,
      };
    })
    .route({
      method: "POST",
      path: "/self-registrations/:id/create-member",
    }),

  listSubmissions: protectedProcedure
    .use(rateLimitMiddleware(2))
    .use(requirePermission({ member: ["update"] }))
    .input(listSubmissionsSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;
      return DB.query.selfRegistrations.listSubmissionsByOrganization({
        organizationId,
        status: input.status,
      });
    })
    .route({ method: "POST", path: "/self-registrations/submissions/query" }),

  updateSubmissionStatus: protectedProcedure
    .use(rateLimitMiddleware(5))
    .use(requirePermission({ member: ["update"] }))
    .input(updateSubmissionStatusSchema)
    .handler(async ({ input, context }) => {
      const organizationId = context.session.activeOrganizationId!;

      const existingSubmission =
        await DB.query.selfRegistrations.getSubmissionById({
          id: input.id,
        });

      if (
        !existingSubmission ||
        existingSubmission.organizationId !== organizationId
      ) {
        throw new ORPCError("NOT_FOUND", {
          message: "Submission not found",
        });
      }

      const updatedSubmission =
        await DB.mutation.selfRegistrations.updateSubmissionStatus({
          submissionId: input.id,
          organizationId,
          status: input.status,
        });

      if (!updatedSubmission) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update submission status",
        });
      }

      return updatedSubmission;
    })
    .route({
      method: "PATCH",
      path: "/self-registrations/submissions/:id/status",
    }),
};
