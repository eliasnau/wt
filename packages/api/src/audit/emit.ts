import { auditEvents, type AuditEventCode } from "./events";
import { auditDenialReasons, type AuditDenialReasonCode } from "./reasons";
import type {
  AuditDeniedInput,
  AuditEventInput,
  AuditEventRecord,
  AuditLogger,
  AuditSuccessInput,
} from "./types";

/**
 * `AuditEventInput` is already a discriminated union — `AuditDeniedInput`
 * *requires* `deniedReason`, `AuditSuccessInput` forbids `outcome: "denied"` —
 * so a single signature enforces the same contract the two overloads did, and
 * unlike them it also accepts the union `emitAuditEvent` passes through.
 */
export function createAuditEvent(
  input: AuditEventInput<AuditEventCode, AuditDenialReasonCode>,
): AuditEventRecord<AuditEventCode, AuditDenialReasonCode> {
  const definition = auditEvents[input.code];

  const base = {
    actor: input.actor,
    category: definition.category,
    code: definition.code as AuditEventCode,
    details: input.details,
    ipAddress: input.ipAddress,
    metadata: input.metadata,
    name: definition.name,
    occurredAt: new Date().toISOString(),
    org: input.org,
    severity: definition.severity,
    target: input.target,
    userAgent: input.userAgent,
  };

  // Discriminate on `input.outcome` directly. Reading it into a local first
  // (`const outcome = input.outcome ?? "success"`) looks equivalent but narrows
  // the *local*, not `input` — which is why every `input.deniedReason` access
  // used to fail to typecheck.
  if (input.outcome === "denied") {
    // Unreachable for typed callers (the union makes it required); kept as a
    // guard for JS callers and for `deniedReason: ""`.
    if (!input.deniedReason) {
      throw new Error(`Denied audit event ${input.code} requires deniedReason`);
    }

    return {
      ...base,
      deniedReason: input.deniedReason,
      deniedReasonDetails: input.deniedReasonDetails,
      deniedReasonName: auditDenialReasons[input.deniedReason]?.name,
      outcome: "denied",
    };
  }

  return { ...base, outcome: "success" };
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
