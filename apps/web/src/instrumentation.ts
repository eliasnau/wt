import { registerPosthogLoggerProvider } from "@repo/api/lib/posthog-otel-logs";

export function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		registerPosthogLoggerProvider();
	}
}
