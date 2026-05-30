import { createContext } from "@matdesk/api/context";
import { appRouter } from "@matdesk/api/routers/index";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { ResponseHeadersPlugin } from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createFileRoute } from "@tanstack/react-router";
import type { EnrichContext } from "evlog";
import {
  createGeoEnricher,
  createRequestSizeEnricher,
  createTraceContextEnricher,
  createUserAgentEnricher,
} from "evlog/enrichers";
import { createFsDrain } from "evlog/fs";
import { withEvlog } from "evlog/orpc";

// Built-in enrichers applied to every oRPC wide event. Listed individually
// (rather than `createDefaultEnrichers()`) so the set is explicit and
// reviewable for anyone unfamiliar with evlog — and so it stays fixed even if
// evlog later changes what its default bundle includes.
const enrichers = [
  createUserAgentEnricher(), // event.userAgent — browser / OS / device from UA header
  createGeoEnricher(), // event.geo — country / region / city from platform headers
  createRequestSizeEnricher(), // event.requestSize — request / response Content-Length
  createTraceContextEnricher(), // event.traceContext + traceId / spanId from W3C traceparent
];

const enrich = (ctx: EnrichContext) => {
  for (const enricher of enrichers) enricher(ctx);
};

// Enrichers run after emit, before drain — so the enriched fields only reach
// drains, not the console line. Persist events as NDJSON in .evlog/logs/ so the
// enrichment is actually captured (and queryable by the analyze-logs tooling).
const drain = createFsDrain();

// Shared options for both oRPC handlers. Tag RPC events with their own service
// (`matdesk-orpc`) so they're distinguishable from the web/SSR wide events
// emitted by the Nitro module (`matdesk-web`).
const evlogOptions = {
  enrich,
  drain,
  routes: { "/api/rpc/**": { service: "matdesk-orpc" } },
};

// `withEvlog` makes each matched request emit one wide event and injects the
// request logger as `context.log` for procedures. Errors thrown in procedures
// are captured on the event by the `evlog()` middleware, so we no longer need
// `onError` console interceptors.
// `ResponseHeadersPlugin` injects `context.resHeaders` (a Headers instance) and
// merges it onto the response — that's how the rate-limit middleware sets
// X-RateLimit-* / Retry-After headers.
const rpcHandler = withEvlog(
  new RPCHandler(appRouter, { plugins: [new ResponseHeadersPlugin()] }),
  {
    ...evlogOptions,
    // The OpenAPI reference is served by `apiHandler` below — let it own those
    // events so we don't emit a spurious 404 from the RPC handler first.
    exclude: ["/api/rpc/api-reference/**"],
  },
);

const apiHandler = withEvlog(
  new OpenAPIHandler(appRouter, {
    plugins: [
      new ResponseHeadersPlugin(),
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
    ],
  }),
  { ...evlogOptions, include: ["/api/rpc/api-reference/**"] },
);

async function handle({ request }: { request: Request }) {
  // `withEvlog` merges the request `log` onto the context it receives.
  const context = await createContext({ req: request });

  const rpcResult = await rpcHandler.handle(request, {
    prefix: "/api/rpc",
    context,
  });
  if (rpcResult.response) return rpcResult.response;

  const apiResult = await apiHandler.handle(request, {
    prefix: "/api/rpc/api-reference",
    context,
  });
  if (apiResult.response) return apiResult.response;

  return new Response("Not found", { status: 404 });
}

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
