export type AuditCategory =
  | "auth"
  | "admin"
  | "organization"
  | "members"
  | "groups"
  | "inventory"
  | "billing";

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditOutcome = "success" | "denied";

export type AuditActor =
  | {
      kind: "user";
      id: string;
      name?: string | null;
      email?: string | null;
    }
  | {
      kind: "system";
      id?: string;
      name?: string;
    };

export type AuditOrg = {
  id: string;
  name?: string | null;
  slug?: string | null;
};

export type AuditTargetKind =
  | "user"
  | "organization"
  | "member"
  | "group"
  | "inventory"
  | "invoice"
  | "sepa"
  | "session"
  | "period";

export type AuditTarget = {
  kind: AuditTargetKind;
  id?: string;
  name?: string | null;
  email?: string | null;
  label?: string | null;
  metadata?: AuditMetadata;
};

export type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | Array<string | number | boolean | null>;

export type AuditMetadata = Record<string, AuditMetadataValue>;

export type AuditEventDefinition = {
  code: string;
  name: string;
  category: AuditCategory;
  severity: AuditSeverity;
  targetKinds: readonly AuditTargetKind[];
  deniable: boolean;
  description: string;
};

export type AuditDenialReasonDefinition = {
  code: string;
  name: string;
  description: string;
  category?: AuditCategory;
};

export type AuditEventBase = {
  actor: AuditActor;
  target: AuditTarget;
  org?: AuditOrg;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string;
  metadata?: AuditMetadata;
};

export type AuditSuccessInput<Code extends string = string> = AuditEventBase & {
  code: Code;
  outcome?: "success";
};

export type AuditDeniedInput<
  Code extends string = string,
  ReasonCode extends string = string,
> = AuditEventBase & {
  code: Code;
  outcome: "denied";
  deniedReason: ReasonCode;
  deniedReasonDetails?: string;
};

export type AuditEventInput<Code extends string = string, ReasonCode extends string = string> =
  | AuditSuccessInput<Code>
  | AuditDeniedInput<Code, ReasonCode>;

export type AuditEventRecord<
  Code extends string = string,
  ReasonCode extends string = string,
> = AuditEventBase & {
  code: Code;
  name: string;
  category: AuditCategory;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  deniedReason?: ReasonCode;
  deniedReasonName?: string;
  deniedReasonDetails?: string;
  occurredAt: string;
};

export type AuditLogger = {
  set: (patch: Record<string, unknown>) => void;
};
