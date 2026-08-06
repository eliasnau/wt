import { auditEvents, type AuditEventCode } from "./events";
import { auditDenialReasons, type AuditDenialReasonCode } from "./reasons";
import type {
  AuditDeniedInput,
  AuditEventInput,
  AuditEventRecord,
  AuditLogger,
  AuditSuccessInput,
} from "./types";

export function createAuditEvent(input: AuditSuccessInput<AuditEventCode>): AuditEventRecord;
export function createAuditEvent(
  input: AuditDeniedInput<AuditEventCode, AuditDenialReasonCode>,
): AuditEventRecord<AuditEventCode, AuditDenialReasonCode>;
export function createAuditEvent(
  input: AuditEventInput<AuditEventCode, AuditDenialReasonCode>,
): AuditEventRecord<AuditEventCode, AuditDenialReasonCode> {
  const definition = auditEvents[input.code];
  const outcome = input.outcome ?? "success";

  if (outcome === "denied" && !input.deniedReason) {
    throw new Error(`Denied audit event ${input.code} requires deniedReason`);
  }

  const deniedReason = outcome === "denied" ? auditDenialReasons[input.deniedReason] : undefined;

  return {
    actor: input.actor,
    category: definition.category,
    code: definition.code as AuditEventCode,
    deniedReason: outcome === "denied" ? input.deniedReason : undefined,
    deniedReasonDetails: outcome === "denied" ? input.deniedReasonDetails : undefined,
    deniedReasonName: deniedReason?.name,
    details: input.details,
    ipAddress: input.ipAddress,
    metadata: input.metadata,
    name: definition.name,
    occurredAt: new Date().toISOString(),
    org: input.org,
    outcome,
    severity: definition.severity,
    target: input.target,
    userAgent: input.userAgent,
  };
}

export function emitAuditEvent(
  log: AuditLogger | null | undefined,
  input:
    | AuditSuccessInput<AuditEventCode>
    | AuditDeniedInput<AuditEventCode, AuditDenialReasonCode>,
) {
  const event = createAuditEvent(input);

  log?.set({
    data: {
      audit: event,
    },
  });

  return event;
}
