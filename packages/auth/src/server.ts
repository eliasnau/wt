import { passkey } from "@better-auth/passkey";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@repo/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import {
  createAuthMiddleware,
  haveIBeenPwned,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { ac, admin, member, owner } from "./permissions";
import { manageSessions } from "./plugins/manageSessions";
import { checkBotId } from "botid/server";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
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
    },
  },
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3001",
  trustedOrigins: [process.env.VERCEL_URL!, process.env.BETTER_AUTH_URL!],
  secret: process.env.BETTER_AUTH_SECRET!,
  emailVerification: {
    sendVerificationEmail: async ({ url }) => {
      console.log("Email Verification: ", url);
    },
  },
  plugins: [
    passkey(),
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
      disableOrganizationDeletion: true,
      dynamicAccessControl: {
        enabled: true,
      },
      membershipLimit: 15,
    }),
    twoFactor({
      issuer: "WT",
    }),
    manageSessions(),
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "This password has been found in a Data breach. Please choose a more secure one",
    }),
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
  },
});

export type Session = typeof auth.$Infer.Session;
