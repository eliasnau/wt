import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	experimental: {
		authInterrupts: true
	},
	async rewrites() {
		return [
		  {
			source: '/ph/static/:path*',
			destination: 'https://eu-assets.i.posthog.com/static/:path*',
		  },
		  {
			source: '/ph/:path*',
			destination: 'https://eu.i.posthog.com/:path*',
		  },
		]
	  },
	  skipTrailingSlashRedirect: true,
};

export default withPostHogConfig(nextConfig, {
	personalApiKey: process.env.POSTHOG_API_KEY!,
	envId: process.env.POSTHOG_ENV_ID!,
	host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	sourcemaps: {
	  enabled: true, 
	  deleteAfterUpload: true, // Optional: Delete sourcemaps after upload, defaults to true
	},
  });
