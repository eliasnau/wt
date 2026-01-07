import posthog from "posthog-js";
import { env } from "@repo/env/web";

if (env.NEXT_PUBLIC_POSTHOG_KEY) {
	posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: "/ph",
		ui_host: "https://eu.posthog.com",
		defaults: "2025-11-30",
		advanced_disable_feature_flags: true,
	});
}
