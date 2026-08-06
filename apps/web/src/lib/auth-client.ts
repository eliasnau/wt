import { dashClient } from "@better-auth/infra/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { ac, admin, member, owner } from "@matdesk/auth/permissions";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient(),
    organizationClient({
      ac,
      roles: { owner, admin, member },
      dynamicAccessControl: {
        enabled: true,
      },
    }),
    adminClient(),
    passkeyClient(),
    dashClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
