import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { env } from "@repo/env/web";

type LogSeverity = "info" | "warn" | "error";
type LogAttributeValue = string | number | boolean | null;
type LogAttributes = Record<string, LogAttributeValue>;

const severityNumbers: Record<LogSeverity, SeverityNumber> = {
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

const otlpLogsUrl = new URL(
  "/i/v1/logs",
  env.NEXT_PUBLIC_POSTHOG_HOST,
).toString();

export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({
    "service.name": "api",
    "cloud.region": process.env.VERCEL_REGION ?? "unknown",
  }),
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: otlpLogsUrl,
        headers: {
          Authorization: `Bearer ${env.NEXT_PUBLIC_POSTHOG_KEY}`,
          "Content-Type": "application/json",
        },
      }),
    ),
  ],
});

export const serverLogger = loggerProvider.getLogger("matdesk-api");

export function registerPosthogLoggerProvider() {
  logs.setGlobalLoggerProvider(loggerProvider);
}

const normalizeAttributes = (attributes: LogAttributes = {}) => {
  const normalized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) {
      continue;
    }
    normalized[key] = value;
  }

  return normalized;
};

export function emitPosthogLog(args: {
  message: string;
  severity: LogSeverity;
  attributes?: LogAttributes;
}) {
  try {
    serverLogger.emit({
      body: args.message,
      severityNumber: severityNumbers[args.severity],
      attributes: normalizeAttributes(args.attributes),
    });
  } catch {
    // Logging should never throw in request paths.
  }
}

export async function flushPosthogLogs() {
  try {
    await loggerProvider.forceFlush();
  } catch {
    // Logging should never throw in request paths.
  }
}
