import { dash } from "@better-auth/infra";
import { passkey } from "@better-auth/passkey";
import { createId } from "@paralleldrive/cuid2";
import { count, db, eq } from "@repo/db";
import { member as organizationMember } from "@repo/db/schema";
import {
	sendEmailVerificationEmail,
	sendOrganizationInvitationEmail,
} from "@repo/emails";
import { Autumn } from "autumn-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import {
	admin as adminPlugin,
	haveIBeenPwned,
	organization,
	twoFactor,
} from "better-auth/plugins";
import { checkBotId } from "botid/server";
import { PostHog } from "posthog-node";
import { ac, admin, member, owner } from "./permissions";
import { manageSessions } from "./plugins/manageSessions";

type OrganizationInvitationEmailPayload = {
	id: string;
	email: string;
	inviter: {
		user: {
			name: string;
			email: string;
		};
	};
	organization: {
		name: string;
	};
};

let posthogClient: PostHog | null = null;
let autumnClient: Autumn | null = null;

function getPostHogServer() {
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
		return null;
	}

	if (!posthogClient) {
		posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
			host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
			flushAt: 1,
			flushInterval: 0,
		});
	}

	return posthogClient;
}

function getAutumnClient() {
	if (!process.env.AUTUMN_SECRET_KEY) {
		return null;
	}

	if (!autumnClient) {
		autumnClient = new Autumn({
			secretKey: process.env.AUTUMN_SECRET_KEY,
		});
	}

	return autumnClient;
}

async function getOrganizationMemberCount(organizationId: string) {
	const [{ count: memberCount = 0 } = { count: 0 }] = await db
		.select({ count: count() })
		.from(organizationMember)
		.where(eq(organizationMember.organizationId, organizationId));

	return memberCount;
}

async function syncOrganizationUsersUsage(organizationId: string) {
	const autumn = getAutumnClient();

	if (!autumn) {
		return;
	}

	const memberCount = await getOrganizationMemberCount(organizationId);
	try {
		await autumn.track({
			customerId: organizationId,
			featureId: "users",
			value: memberCount,
		});
	} catch (error) {
		console.error("Failed to sync Autumn users usage", {
			organizationId,
			memberCount,
			error,
		});
	}
}

async function setOrganizationUsersUsage(
	organizationId: string,
	memberCount: number,
) {
	const autumn = getAutumnClient();

	if (!autumn) {
		return;
	}

	try {
		await autumn.track({
			customerId: organizationId,
			featureId: "users",
			value: memberCount,
		});
	} catch (error) {
		console.error("Failed to set Autumn users usage", {
			organizationId,
			memberCount,
			error,
		});
	}
}

async function ensureOrganizationCanAddUser(organizationId: string) {
	const autumn = getAutumnClient();

	if (!autumn) {
		return;
	}

	await syncOrganizationUsersUsage(organizationId);

	let response;
	try {
		response = await autumn.check({
			customerId: organizationId,
			featureId: "users",
			requiredBalance: 1,
		});
	} catch (error) {
		console.error("Failed to check Autumn users access", {
			organizationId,
			error,
		});
		throw new APIError("BAD_REQUEST", {
			message: "Unable to verify organization user limit",
		});
	}

	if (!response.allowed) {
		throw new APIError("BAD_REQUEST", {
			message: "Organization has reached its user limit",
		});
	}
}

function getReturnedUserId(returned: unknown) {
	if (
		returned &&
		typeof returned === "object" &&
		"user" in returned &&
		returned.user &&
		typeof returned.user === "object" &&
		"id" in returned.user &&
		typeof returned.user.id === "string"
	) {
		return returned.user.id;
	}

	return undefined;
}

function captureServerEvent(
	event:
		| "auth:sign-in"
		| "auth:sign-up"
		| "org:create"
		| "org:delete"
		| "org:update"
		| "invitation:create"
		| "invitation:accept"
		| "invitation:reject"
		| "invitation:revoke",
	distinctId: string,
	properties: Record<string, unknown>,
) {
	const posthog = getPostHogServer();
	if (!posthog) {
		return;
	}

	try {
		posthog.capture({
			distinctId,
			event,
			properties,
		});
	} catch (error) {
		console.error(`Failed to capture PostHog event: ${event}`, error);
	}
}

function getPublicBaseUrl() {
	const baseUrl =
		process.env.BETTER_AUTH_URL ||
		process.env.VERCEL_URL ||
		"http://localhost:3001";

	return /^https?:\/\//.test(baseUrl) ? baseUrl : `https://${baseUrl}`;
}

export const auth = betterAuth({
	appName: "matdesk",
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	advanced: {
		ipAddress: {
			// For Cloudflare
			//ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],

			// For Vercel
			ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],

			// For AWS/Generic
			// ipAddressHeaders: ["x-forwarded-for"],
		},
		database: {
			generateId: (options) => {
				if (options.model === "user" || options.model === "users") {
					return `user_${createId()}`;
				}

				if (options.model === "organization") {
					return `org_${createId()}`;
				}

				if (options.model === "session") {
					return `sess_${createId()}`;
				}

				if (options.model === "account") {
					return `acct_${createId()}`;
				}

				return createId();
			},
		},
	},
	// secondaryStorage: {
	// 	get: async (key) => {
	// 		return await redis.get(key);
	// 	},
	// 	set: async (key, value, ttl) => {
	// 		if (ttl) await redis.set(key, value, { ex: ttl });
	// 		else await redis.set(key, value);
	// 	},
	// 	delete: async (key) => {
	// 		await redis.del(key);
	// 	}
	// },
	// rateLimit: {
	// 	storage: "secondary-storage",
	// 	window: 60,
	//     max: 100,
	// },
	emailAndPassword: {
		enabled: true,
	},
	user: {
		additionalFields: {
			hideSensitiveInformatoin: {
				type: "boolean",
				required: false,
				defaultValue: false,
			},
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 3 * 60,
			strategy: "jwe",
		},
	},
	baseURL:
		process.env.BETTER_AUTH_URL ||
		process.env.VERCEL_URL ||
		"http://localhost:3001",
	trustedOrigins: [process.env.VERCEL_URL!, process.env.BETTER_AUTH_URL!],
	secret: process.env.BETTER_AUTH_SECRET!,
	emailVerification: {
		sendOnSignUp: true,
		sendOnSignIn: true,
		sendVerificationEmail: async ({ user, token, url }) => {
			const verificationUrl = new URL(url);
			const manualVerificationUrl = new URL(
				"/verify-email",
				verificationUrl.origin,
			);
			manualVerificationUrl.searchParams.set("token", token);

			const callbackURL = verificationUrl.searchParams.get("callbackURL");
			if (callbackURL) {
				manualVerificationUrl.searchParams.set("callbackURL", callbackURL);
			}

			try {
				await sendEmailVerificationEmail({
					email: user.email,
					userName: user.name,
					verificationLink: manualVerificationUrl.toString(),
				});
			} catch (error) {
				console.error("Failed to send verification email", error);
			}
		},
	},
	plugins: [
		passkey(),
		adminPlugin(),
		organization({
			ac,
			allowUserToCreateOrganization: async (user) => {
				return user.role === "admin";
			},
			requireEmailVerificationOnInvitation: true,
			roles: {
				owner,
				admin,
				member,
			},
			async sendInvitationEmail(data) {
				const inviteData = data as OrganizationInvitationEmailPayload;
				const inviteLink = `${getPublicBaseUrl()}/accept-invitation/${inviteData.id}`;
				try {
					await sendOrganizationInvitationEmail({
						email: inviteData.email,
						invitedByUsername: inviteData.inviter.user.name,
						invitedByEmail: inviteData.inviter.user.email,
						organizationName: inviteData.organization.name,
						inviteLink,
					});
				} catch (error) {
					console.error("Failed to send organization invitation email", error);
				}
			},
			disableOrganizationDeletion: true,
			dynamicAccessControl: {
				enabled: true,
			},
			membershipLimit: 15,
			organizationHooks: {
				beforeAddMember: async ({ organization }) => {
					await ensureOrganizationCanAddUser(organization.id);
				},
				beforeCreateInvitation: async ({ organization }) => {
					await ensureOrganizationCanAddUser(organization.id);
				},
				afterAddMember: async ({ organization }) => {
					await syncOrganizationUsersUsage(organization.id);
				},
				afterRemoveMember: async ({ organization }) => {
					await syncOrganizationUsersUsage(organization.id);
				},
				afterCreateOrganization: async ({ organization, member, user }) => {
					await setOrganizationUsersUsage(organization.id, 1);

					captureServerEvent("org:create", user.id, {
						organizationId: organization.id,
						organizationName: organization.name,
						organizationSlug: organization.slug,
						userRole: member.role,
					});
				},
				afterDeleteOrganization: async ({ organization, user }) => {
					captureServerEvent("org:delete", user.id, {
						organizationId: organization.id,
						organizationName: organization.name,
						organizationSlug: organization.slug,
					});
				},
				afterUpdateOrganization: async ({ organization, user, member }) => {
					if (!organization) {
						return;
					}

					captureServerEvent("org:update", user.id, {
						organizationId: organization.id,
						organizationName: organization.name,
						organizationSlug: organization.slug,
						userRole: member.role,
						updatedBy: user.id,
					});
				},
				afterCreateInvitation: async ({
					invitation,
					inviter,
					organization,
				}) => {
					captureServerEvent("invitation:create", inviter.id, {
						invitationId: invitation.id,
						inviteeEmail: invitation.email,
						organizationId: organization.id,
						organizationName: organization.name,
						inviterUserId: inviter.id,
						inviterEmail: inviter.email,
						role: invitation.role,
					});
				},
				afterAcceptInvitation: async ({
					invitation,
					member,
					user,
					organization,
				}) => {
					captureServerEvent("invitation:accept", user.id, {
						invitationId: invitation.id,
						userId: user.id,
						userEmail: user.email,
						organizationId: organization.id,
						organizationName: organization.name,
						role: member.role,
					});
				},
				afterRejectInvitation: async ({ invitation, user, organization }) => {
					captureServerEvent("invitation:reject", user.id, {
						invitationId: invitation.id,
						userId: user.id,
						userEmail: user.email,
						organizationId: organization.id,
						organizationName: organization.name,
						rejectedEmail: invitation.email,
					});
				},
				afterCancelInvitation: async ({
					invitation,
					cancelledBy,
					organization,
				}) => {
					captureServerEvent("invitation:revoke", cancelledBy.id, {
						invitationId: invitation.id,
						revokedByUserId: cancelledBy.id,
						revokedByEmail: cancelledBy.email,
						organizationId: organization.id,
						organizationName: organization.name,
						inviteeEmail: invitation.email,
					});
				},
			},
		}),
		twoFactor({
			issuer: "WT",
		}),
		manageSessions(),
		haveIBeenPwned({
			customPasswordCompromisedMessage:
				"This password has been found in a Data breach. Please choose a more secure one",
		}),
		dash(),
		nextCookies(), //! has to be last plugin in array
	],
	experimental: { joins: true },
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (!(ctx.path === "/sign-up/email" || ctx.path === "/sign-in/email")) {
				return;
			}
			const checkLevel =
				ctx.path === "/sign-up/email" ? "deepAnalysis" : "basic";

			const verification = await checkBotId({
				developmentOptions: {
					bypass: "HUMAN",
				},
				advancedOptions: {
					checkLevel,
				},
			});

			if (verification.isBot) {
				throw new APIError("BAD_REQUEST", {
					message: "Captcha verification failed",
				});
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			const userId =
				ctx.context.newSession?.user.id ??
				getReturnedUserId(ctx.context.returned);

			if (!userId) {
				return;
			}

			if (ctx.path === "/sign-up/email") {
				captureServerEvent("auth:sign-up", userId, {
					auth_method: "email",
				});
				return;
			}

			if (ctx.path === "/sign-in/email") {
				captureServerEvent("auth:sign-in", userId, {
					auth_method: "email",
					has_two_factor: !!ctx.context.newSession?.user.twoFactorEnabled,
				});
				return;
			}

			if (ctx.path === "/passkey/verify-authentication") {
				captureServerEvent("auth:sign-in", userId, {
					auth_method: "passkey",
				});
			}
		}),
	},
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
