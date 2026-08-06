import { describe, expect, it } from "vitest";

import { createAuditEvent, emitAuditEvent } from "./emit";

const actor = { kind: "system", name: "System" } as const;
const target = { kind: "user", id: "usr_1", email: "user@example.com" } as const;

describe("audit events", () => {
  it("creates success events from the catalog", () => {
    const event = createAuditEvent({
      actor,
      code: "SIGN_IN",
      target,
    });

    expect(event.code).toBe("SIGN_IN");
    expect(event.name).toBe("Sign in");
    expect(event.outcome).toBe("success");
    expect(event.deniedReason).toBeUndefined();
  });

  it("requires and resolves denied reasons", () => {
    const event = createAuditEvent({
      actor,
      code: "SIGN_IN",
      deniedReason: "USER_BANNED",
      outcome: "denied",
      target,
    });

    expect(event.outcome).toBe("denied");
    expect(event.deniedReason).toBe("USER_BANNED");
    expect(event.deniedReasonName).toBe("Benutzer gesperrt");
  });

  it("emits audit data onto the request logger", () => {
    const patches: Array<Record<string, unknown>> = [];

    const event = emitAuditEvent(
      { set: (patch) => patches.push(patch) },
      {
        actor,
        code: "USER_BAN",
        details: "Manual admin action",
        target,
      },
    );

    expect(event.code).toBe("USER_BAN");
    expect(patches).toHaveLength(1);
    expect(patches[0]).toEqual({ data: { audit: event } });
  });
});
