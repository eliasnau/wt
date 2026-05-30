import { expo } from "@better-auth/expo";
import { dash } from "@better-auth/infra";
import { passkey } from "@better-auth/passkey";
import { and, count, createDb, eq } from "@matdesk/db";
import { member as organizationMember } from "@matdesk/db/schema";
import * as authSchema from "@matdesk/db/schema/auth";
import { env } from "@matdesk/env/server";
import { createId } from "@paralleldrive/cuid2";
import { betterAuth, type Auth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";
import {
  organization,
  type OrganizationOptions,
} from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { ac, admin, member, owner } from "./permissions";

const MAX_ORGS_PER_USER = 5;
const MAX_MEMBERS_PER_ORGANIZATION = 10;

const organizationHooks = {
  beforeAddMember: async () => {
    // TODO(paywall): await ensureOrganizationCanAddUser(organization.id);
  },
  beforeCreateInvitation: async () => {
    // TODO(paywall): await ensureOrganizationCanAddUser(organization.id);
  },
  afterAddMember: async () => {
    // TODO(paywall): await syncOrganizationUsersUsage(organization.id);
  },
  afterRemoveMember: async () => {
    // TODO(paywall): await syncOrganizationUsersUsage(organization.id);
  },
  afterCreateOrganization: async () => {
    // TODO(paywall): await setOrganizationUsersUsage(organization.id, 1);
  },
} satisfies NonNullable<OrganizationOptions["organizationHooks"]>;

export function createAuth(): Auth<any> {
  const db = createDb();

  return betterAuth({
    appName: "matdesk",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    trustedOrigins: [
      env.CORS_ORIGIN,
      "matdesk://",
      "exp://",
      "http://localhost:8081",
    ],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    emailAndPassword: {
      enabled: true,
    },

    session: {
      // Signed-cookie cache so most requests skip the DB session lookup.
      // Sessions still expire on the normal schedule; this only for caching
      cookieCache: {
        enabled: true,
        maxAge: 1 * 60, // 1 Minute
        strategy: "jwe",
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      sendVerificationEmail: async ({ user, token: _token, url }) => {
        // TODO(emails): integrate with a real email
        console.log(`[auth] Verify email for ${user.email}: ${url}`);
      },
    },

    advanced: {
      ipAddress: {
        ipAddressHeaders: [
          "x-forwarded-for",
          "x-real-ip",
          "x-vercel-forwarded-for",
        ],
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

    plugins: [
      twoFactor({ issuer: "matdesk" }),

      organization({
        ac,
        roles: { owner, admin, member },

        // Only platform admins can create new orgs. (`user.role` is set by
        // the admin plugin below.)
        allowUserToCreateOrganization: async (user) => user.role === "admin",

        // Cap orgs per user. Platform admins are unlimited.
        // Return `true` to block
        organizationLimit: async (user) => {
          if (user.role === "admin") return false;
          const [row] = await db
            .select({ count: count() })
            .from(organizationMember)
            .where(
              and(
                eq(organizationMember.userId, user.id),
                eq(organizationMember.role, "owner"),
              ),
            );
          return (row?.count ?? 0) >= MAX_ORGS_PER_USER;
        },

        requireEmailVerificationOnInvitation: true,
        disableOrganizationDeletion: true,
        membershipLimit: MAX_MEMBERS_PER_ORGANIZATION,

        // Org admins can define custom roles at runtime
        dynamicAccessControl: {
          enabled: true,
        },

        sendInvitationEmail: async (data) => {
          // TODO(emails): Email sending
          // The frontend handles acceptance at `/accept-invitation/{id}`.
          const payload = data as {
            id: string;
            email: string;
            inviter: { user: { email: string } };
            organization: { name: string };
          };
          console.log(
            `[auth] Org invitation → ${payload.email} for "${payload.organization.name}"` +
              ` (id=${payload.id}, inviter=${payload.inviter.user.email})`,
          );
        },

        organizationHooks,
      }),

      adminPlugin(),

      passkey({
        rpName: "matdesk",
        origin: env.BETTER_AUTH_URL,
      }),

      haveIBeenPwned({
        customPasswordCompromisedMessage:
          "Dieses Passwort taucht in einer bekannten Datenpanne auf. Bitte wähle ein anderes.",
      }),

      ...(env.BETTER_AUTH_API_KEY
        ? [
            dash({
              apiKey: env.BETTER_AUTH_API_KEY,
              apiUrl: env.BETTER_AUTH_API_URL,
              kvUrl: env.BETTER_AUTH_KV_URL,
            }),
          ]
        : []),

      tanstackStartCookies(),
      expo(),
    ],
  });
}

export const auth = createAuth();

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];

export {
  ac,
  admin,
  getActionLabel,
  getResourceLabel,
  member,
  owner,
  permissionList,
  permissionMetadata,
  roles,
  type PermissionAction,
  type PermissionCheck,
  type PermissionResource,
  type RoleName,
} from "./permissions";
