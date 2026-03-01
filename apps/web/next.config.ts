import { withPostHogConfig } from "@posthog/nextjs-config";
import { withBotId } from "botid/next/config";
import { env } from "@repo/env/web";
import type { NextConfig } from "next";
import "@repo/env/web";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  experimental: {
    authInterrupts: true,
  },
  async rewrites() {
    return [
      {
        source: "/dashboard/members",
        destination: "/dashboard/membersv2",
      },
      {
        source: "/ph/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ph/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withBotId(nextConfig);
// withPostHogConfig(nextConfig, {
// 	personalApiKey: env.POSTHOG_API_KEY,
// 	envId: env.POSTHOG_ENV_ID,
// 	host: env.NEXT_PUBLIC_POSTHOG_HOST,
// 	sourcemaps: {
// 		enabled: Boolean(env.POSTHOG_API_KEY && env.POSTHOG_ENV_ID),
// 		deleteAfterUpload: true,
// 	},
// });
