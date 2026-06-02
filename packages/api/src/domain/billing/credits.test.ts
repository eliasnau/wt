import { describe, expect, it } from "vitest";

import { allocateCredits, type CreditGrantForAllocation, creditRestorations } from "./credits";
import type { InvoiceLineDraft } from "./lines";

const ORG = "org-1";

function membership(total: number): InvoiceLineDraft {
  return {
    organizationId: ORG,
    type: "membership_fee",
    description: "Membership fee",
    quantity: 1,
    unitAmountCents: total,
    totalAmountCents: total,
    coverageStart: "2026-05-01",
    coverageEnd: "2026-05-31",
  };
}

function arrears(total: number): InvoiceLineDraft {
  return { ...membership(total), type: "arrears" };
}

describe("allocateCredits", () => {
  it("does nothing when the balance is already zero or negative", () => {
    const result = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [membership(0)],
      grants: [{ id: "g", type: "money", remainingCycles: null, remainingAmountCents: 9999 }],
    });
    expect(result.creditLines).toEqual([]);
    expect(result.grantUpdates).toEqual([]);
  });

  it("applies a money credit up to the balance (grant larger than balance)", () => {
    const result = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [membership(3000)],
      grants: [{ id: "g", type: "money", remainingCycles: null, remainingAmountCents: 5000 }],
    });
    expect(result.creditLines).toHaveLength(1);
    expect(result.creditLines[0]).toMatchObject({
      type: "credit_money",
      totalAmountCents: -3000,
      creditGrantId: "g",
    });
    expect(result.grantUpdates).toEqual([{ grantId: "g", remainingAmountCentsDelta: -3000 }]);
  });

  it("applies a money credit partially when the grant is smaller than the balance", () => {
    const result = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [membership(5000)],
      grants: [{ id: "g", type: "money", remainingCycles: null, remainingAmountCents: 2000 }],
    });
    expect(result.creditLines[0]?.totalAmountCents).toBe(-2000);
    expect(result.grantUpdates).toEqual([{ grantId: "g", remainingAmountCentsDelta: -2000 }]);
  });

  it("drains money grants oldest-first until the balance is covered", () => {
    const grants: CreditGrantForAllocation[] = [
      { id: "g1", type: "money", remainingCycles: null, remainingAmountCents: 2000 },
      { id: "g2", type: "money", remainingCycles: null, remainingAmountCents: 5000 },
    ];
    const result = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [membership(3000)],
      grants,
    });
    expect(result.grantUpdates).toEqual([
      { grantId: "g1", remainingAmountCentsDelta: -2000 },
      { grantId: "g2", remainingAmountCentsDelta: -1000 },
    ]);
  });

  it("a billing-cycle credit zeroes the month's membership (free month)", () => {
    const result = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [membership(4000), membership(3000)],
      grants: [{ id: "c", type: "billing_cycles", remainingCycles: 2, remainingAmountCents: null }],
    });
    expect(result.creditLines).toHaveLength(1);
    expect(result.creditLines[0]).toMatchObject({
      type: "credit_cycle",
      totalAmountCents: -7000,
      creditGrantId: "c",
    });
    expect(result.grantUpdates).toEqual([{ grantId: "c", remainingCyclesDelta: -1 }]);
  });

  it("does NOT apply cycle credits to arrears (only money credits can)", () => {
    const cycle = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [arrears(4000)],
      grants: [{ id: "c", type: "billing_cycles", remainingCycles: 1, remainingAmountCents: null }],
    });
    expect(cycle.creditLines).toEqual([]);

    const money = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [arrears(4000)],
      grants: [{ id: "m", type: "money", remainingCycles: null, remainingAmountCents: 4000 }],
    });
    expect(money.creditLines[0]?.totalAmountCents).toBe(-4000);
  });

  it("combines a cycle credit then a money credit for leftover fees", () => {
    // membership 4000 covered by cycle; a 2000 yearly fee remains, covered by money
    const yearly: InvoiceLineDraft = { ...membership(2000), type: "yearly_fee" };
    const result = allocateCredits({
      organizationId: ORG,
      monthStart: "2026-05-01",
      lines: [membership(4000), yearly],
      grants: [
        { id: "c", type: "billing_cycles", remainingCycles: 1, remainingAmountCents: null },
        { id: "m", type: "money", remainingCycles: null, remainingAmountCents: 10000 },
      ],
    });
    expect(result.creditLines.map((l) => [l.type, l.totalAmountCents])).toEqual([
      ["credit_cycle", -4000],
      ["credit_money", -2000],
    ]);
    expect(result.grantUpdates).toEqual([
      { grantId: "c", remainingCyclesDelta: -1 },
      { grantId: "m", remainingAmountCentsDelta: -2000 },
    ]);
  });
});

describe("creditRestorations", () => {
  it("gives back money amounts and cycle counts; ignores other lines", () => {
    const updates = creditRestorations([
      { type: "credit_money", totalAmountCents: -2500, creditGrantId: "m" },
      { type: "credit_cycle", totalAmountCents: -4000, creditGrantId: "c" },
      { type: "membership_fee", totalAmountCents: 4000, creditGrantId: null },
      { type: "credit_money", totalAmountCents: -100, creditGrantId: null }, // no grant → ignored
    ]);
    expect(updates).toEqual([
      { grantId: "m", remainingAmountCentsDelta: 2500 },
      { grantId: "c", remainingCyclesDelta: 1 },
    ]);
  });
});
