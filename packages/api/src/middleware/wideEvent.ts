import { os } from "@orpc/server";
import type { BaseContext } from "../context";
import { logger } from "../lib/logger";
import { after } from "next/server";
import { geolocation, ipAddress } from "@vercel/functions";

export interface WideEvent {
	log_type: "wide_event";

	trace_id?: string;
	request_id: string;
	timestamp: string;
	method: string;
	path: string;
	service: string;
	deployment_id?: string;
	region?: string;
	ip?: string;
	geo?: {
		city?: string | null;
		country?: string | null;
		region?: string | null;
	};

	user_id?: string;
	organization_id?: string;

	status_code?: number;
	outcome?: "success" | "error";
	severity?: "info" | "warning" | "error";
	duration_ms?: number;

	error?: {
		type: string;
		message: string;
		code?: string;
		stack?: string;
	};

	action: string;
}

/**
 * Wide event middleware - collects request context throughout the request lifecycle
 * and emits a single log event at the end.
 */
export const wideEventMiddleware = <TContext extends BaseContext>() => {
	return os.$context<TContext>().middleware(async ({ context, next, path }) => {
		const startTime = Date.now();
		const traceId =
			context.req.headers.get("x-trace-id") || crypto.randomUUID();

		const action = path.join(".");

		const event: WideEvent = {
			log_type: "wide_event",
			trace_id: traceId,
			request_id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			method: context.req.method,
			action,
			path: context.req.nextUrl.pathname,
			service: "api",
		};

		const ip = ipAddress(context.req);
		const geo = geolocation(context.req);

		if (ip) {
			event.ip = ip;
		}

		if (geo) {
			event.geo = {
				city: geo.city,
				country: geo.country,
				region: geo.region,
			};
		}

		if (process.env.VERCEL_DEPLOYMENT_ID) {
			event.deployment_id = process.env.VERCEL_DEPLOYMENT_ID;
		}
		if (process.env.VERCEL_REGION) {
			event.region = process.env.VERCEL_REGION;
		}

		try {
			const result = await next({
				context: {
					...context,
					wideEvent: event,
				},
			});
			event.status_code = 200;
			event.outcome = "success";
			event.severity = "info";

			return result;
		} catch (error: unknown) {
			const err = error instanceof Error ? error : new Error("Unknown error");
			const errorCode =
				typeof (error as { code?: unknown })?.code === "string"
					? (error as { code: string }).code
					: undefined;
			const status =
				typeof (error as { status?: unknown })?.status === "number"
					? (error as { status: number }).status
					: typeof (error as { statusCode?: unknown })?.statusCode === "number"
						? (error as { statusCode: number }).statusCode
						: undefined;
			event.outcome = "error";
			event.error = {
				type: err.name || "Error",
				message: err.message || "Unknown error",
				code: errorCode,
			};

			event.status_code = status ?? 500;

			// 4xx = client errors (warnings)
			// 5xx = server errors (errors)
			if (
				event.status_code &&
				event.status_code >= 400 &&
				event.status_code < 500
			) {
				event.severity = "warning";
			} else {
				event.severity = "error";
			}

			throw error;
		} finally {
			event.duration_ms = Date.now() - startTime;

			after(() => {
				const message = `${event.method} ${event.path}`;

				if (event.severity === "error") {
					logger.error(message, event);
				} else if (event.severity === "warning") {
					logger.warn(message, event);
				} else {
					logger.info(message, event);
				}
			});
		}
	});
};
