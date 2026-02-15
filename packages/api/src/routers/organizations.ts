import { protectedProcedure } from "../index";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";
import { z } from "zod";
import { db, eq } from "@repo/db";
import { organizationSettings } from "@repo/db/schema";
import {
	mapSepaRowToSettings,
	sepaSettingsSchema,
	loadSepaModule,
	validateCreditorDetailsIfPresent,
} from "../lib/sepa";

const addDomainSchema = z.object({
	domain: z
		.string()
		.regex(
			/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i,
			"Invalid domain format",
		),
});

const updateOrganizationSettingsSchema = sepaSettingsSchema;
type DomainDnsRecord = {
	type:
		| "A"
		| "AAAA"
		| "CNAME"
		| "MX"
		| "NS"
		| "SOA"
		| "PTR"
		| "SRV"
		| "TXT"
		| "CAA";
	name: string;
	value: string;
};

export const organizationsRouter = {
	addDomain: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ organization: ["update"] }))
		.input(addDomainSchema)
		/*
		.handler(async ({ context, input }) => {
			const organizationId = context.session.activeOrganizationId!;
			try {
				const [currentOrg] = await db
					.select({ domain: organization.domain })
					.from(organization)
					.where(eq(organization.id, organizationId))
					.limit(1);

				if (currentOrg?.domain) {
					throw new ORPCError("BAD_REQUEST", {
						message:
							"Domain already exists. Please remove the existing domain before adding a new one.",
					});
				}

				if (!projectId) {
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message:
							"Vercel integration is not configured. Please contact support to enable custom domains.",
					});
				}

				const trimmedDomain = input.domain.trim().toLowerCase();

				const [existingOrg] = await db
					.select({ id: organization.id })
					.from(organization)
					.where(eq(organization.domain, trimmedDomain))
					.limit(1);

				if (existingOrg) {
					throw new ORPCError("CONFLICT", {
						message: "This domain is already in use by another organization",
					});
				}

				const domainStatus = await addDomain(trimmedDomain);

				await db
					.update(organization)
					.set({ domain: trimmedDomain })
					.where(eq(organization.id, organizationId));

				return {
					success: true,
					domain: trimmedDomain,
					verified: domainStatus.status === "Valid Configuration",
					verificationRequired: domainStatus.status !== "Valid Configuration",
					status: domainStatus.status,
					dnsRecordsToSet: domainStatus.dnsRecordsToSet,
				};
			} catch (error) {
				after(() => {
					logger.error("Failed to add domain", {
						error,
						user_id: context.user.id,
						organization_id: organizationId,
						input_domain: input.domain,
						deployment_id: context.wideEvent.deployment_id,
						region: context.wideEvent.region,
						trace_id: context.wideEvent.trace_id,
						request_id: context.wideEvent.request_id,
						timestamp: new Date().toISOString(),
					});
				});

				if (error instanceof ORPCError) throw error;
				throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to add domain" });
			}
		}),
		*/
		.handler(async () => {
			return {
				success: false,
				domain: null,
				verified: false,
				verificationRequired: false,
				status: "Domain support is currently disabled",
				dnsRecordsToSet: null as DomainDnsRecord | null,
			};
		}),

	getDomainStatus: protectedProcedure
		.use(rateLimitMiddleware(10))
		/*
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;
			try {
				const [org] = await db
					.select({ domain: organization.domain })
					.from(organization)
					.where(eq(organization.id, organizationId))
					.limit(1);

				if (!org?.domain) {
					return {
						domain: null,
						verified: false,
						verificationRequired: false,
						vercelConfigured: !!projectId,
						status: "Domain is not added",
						dnsRecordsToSet: null,
					};
				}

				if (!projectId) {
					return {
						domain: org.domain,
						verified: false,
						verificationRequired: true,
						vercelConfigured: false,
						status: "Invalid Configuration",
						dnsRecordsToSet: null,
					};
				}

				try {
					const domainStatus = await getDomainStatus(org.domain);
					const isVerified = domainStatus.status === "Valid Configuration";
					return {
						domain: org.domain,
						verified: isVerified,
						verificationRequired: !isVerified,
						vercelConfigured: true,
						status: domainStatus.status,
						dnsRecordsToSet: domainStatus.dnsRecordsToSet,
					};
				} catch (err) {
					after(() => {
						logger.warn("Failed to check domain status in Vercel", {
							error: err,
							domain: org.domain,
							organization_id: organizationId,
						});
					});

					return {
						domain: org.domain,
						verified: false,
						verificationRequired: true,
						vercelConfigured: true,
						status: "Invalid Configuration",
						dnsRecordsToSet: null,
					};
				}
			} catch (error) {
				after(() => {
					logger.error("Failed to get domain status", {
						error,
						user_id: context.user.id,
						organization_id: organizationId,
						deployment_id: context.wideEvent.deployment_id,
						region: context.wideEvent.region,
						trace_id: context.wideEvent.trace_id,
						request_id: context.wideEvent.request_id,
						timestamp: new Date().toISOString(),
					});
				});

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get domain status",
				});
			}
		}),
		*/
		.handler(async () => {
			return {
				domain: null,
				verified: false,
				verificationRequired: false,
				vercelConfigured: false,
				status: "Domain support is currently disabled",
				dnsRecordsToSet: null as DomainDnsRecord | null,
			};
		}),

	removeDomain: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ organization: ["update"] }))
		/*
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;
			try {
				const [currentOrg] = await db
					.select({ domain: organization.domain })
					.from(organization)
					.where(eq(organization.id, organizationId))
					.limit(1);

				if (!currentOrg?.domain) {
					throw new ORPCError("BAD_REQUEST", {
						message: "No domain configured for this organization",
					});
				}

				if (projectId) {
					try {
						await projectsRemoveProjectDomain(vercel, {
							idOrName: projectId,
							teamId: teamId,
							domain: currentOrg.domain,
						});
					} catch (err) {
						after(() => {
							logger.warn("Failed to remove domain from Vercel", {
								error: err,
								domain: currentOrg.domain,
								organization_id: organizationId,
							});
						});
					}
				}

				await db
					.update(organization)
					.set({ domain: null })
					.where(eq(organization.id, organizationId));

				return {
					success: true,
					message: "Domain removed successfully",
				};
			} catch (error) {
				after(() => {
					logger.error("Failed to remove domain", {
						error,
						user_id: context.user.id,
						organization_id: organizationId,
						deployment_id: context.wideEvent.deployment_id,
						region: context.wideEvent.region,
						trace_id: context.wideEvent.trace_id,
						request_id: context.wideEvent.request_id,
						timestamp: new Date().toISOString(),
					});
				});

				if (error instanceof ORPCError) throw error;
				throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to remove domain" });
			}
		}),
		*/
		.handler(async () => {
			return {
				success: true,
				message: "Domain support is currently disabled",
			};
		}),

	getSettings: protectedProcedure
		.use(rateLimitMiddleware(3))
		.use(requirePermission({ finance: ["view"] }))
		.handler(async ({ context }) => {
			const organizationId = context.session.activeOrganizationId!;

			const [row] = await db
				.select()
				.from(organizationSettings)
				.where(eq(organizationSettings.organizationId, organizationId))
				.limit(1);

			return {
				settings: row ? mapSepaRowToSettings(row) : null,
			};
		}),

	updateSettings: protectedProcedure
		.use(rateLimitMiddleware(5))
		.use(requirePermission({ finance: ["export"] }))
		.input(updateOrganizationSettingsSchema)
		.handler(async ({ context, input }) => {
			const organizationId = context.session.activeOrganizationId!;

			const normalized = {
				...input,
				creditorName: input.creditorName?.trim() || undefined,
				creditorIban:
					input.creditorIban?.replace(/\s+/g, "").toUpperCase() ||
					undefined,
				creditorBic:
					input.creditorBic?.replace(/\s+/g, "").toUpperCase() || undefined,
				creditorId:
					input.creditorId?.replace(/\s+/g, "").toUpperCase() || undefined,
				initiatorName: input.initiatorName?.trim() || undefined,
				remittanceTemplates: input.remittanceTemplates
					? {
							membership:
								input.remittanceTemplates.membership?.trim() || undefined,
							joiningFee:
								input.remittanceTemplates.joiningFee?.trim() || undefined,
							yearlyFee: input.remittanceTemplates.yearlyFee?.trim() || undefined,
						}
					: undefined,
			};

			const sepa = await loadSepaModule();
			validateCreditorDetailsIfPresent(sepa, normalized);

			const existing = await db
				.select({ organizationId: organizationSettings.organizationId })
				.from(organizationSettings)
				.where(eq(organizationSettings.organizationId, organizationId))
				.limit(1);

			const values = {
				organizationId,
				creditorName: normalized.creditorName ?? null,
				creditorIban: normalized.creditorIban ?? null,
				creditorBic: normalized.creditorBic ?? null,
				creditorId: normalized.creditorId ?? null,
				initiatorName: normalized.initiatorName ?? null,
				batchBooking: normalized.batchBooking ?? true,
				remittanceMembership:
					normalized.remittanceTemplates?.membership ?? null,
				remittanceJoiningFee:
					normalized.remittanceTemplates?.joiningFee ?? null,
				remittanceYearlyFee:
					normalized.remittanceTemplates?.yearlyFee ?? null,
			};

			if (existing.length === 0) {
				await db.insert(organizationSettings).values(values);
			} else {
				await db
					.update(organizationSettings)
					.set(values)
					.where(eq(organizationSettings.organizationId, organizationId));
			}

			return {
				settings: normalized,
			};
		}),
};
