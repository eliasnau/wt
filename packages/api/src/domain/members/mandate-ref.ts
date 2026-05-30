import { randomBytes } from "node:crypto";

const PREFIX = "MD";
const RAW_BYTES = 12;

/**
 * Generate a unique SEPA mandate reference. Format: `MD-{24 hex chars}`.
 *
 * The reference is sent to the bank as part of the direct-debit instruction
 * and used by the customer to identify the mandate on their statement. It
 * must be unique per mandate and stable for its lifetime — never reuse.
 *
 * Spec allows up to 35 chars; we use 27 (`MD-` + 24 hex) to leave headroom.
 */
export function generateMandateReference(): string {
  return `${PREFIX}-${randomBytes(RAW_BYTES).toString("hex").toUpperCase()}`;
}
