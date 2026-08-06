import { describe, expect, it } from "vitest";

import { type ContractForPlan, planContractBilling, type PlannedInvoice } from "./plan";

function contract(overrides: Partial<ContractForPlan> = {}): ContractForPlan {
  return {
    status: "active",
    startDate: "2026-01-01",
    settledThroughDate: null,
    cancellationEffectiveDate: null,
    joiningFeePaid: false,
    joiningFeeCents: null,
    yearlyFeeCents: null,
    yearlyFeeMode: "january",
    ...overrides,
  };
}

function plan(
  overrides: Partial<Parameters<typeof planContractBilling>[0]> = {},
): PlannedInvoice[] {
  return planContractBilling({
    contract: contract(),
    targetMonth: "2026-01-01",
    existingMonths: new Set(),
    billedYearlyCycles: new Set(),
    hasMembershipCharges: true,
    ...overrides,
  }).invoices;
}

describe("planContractBilling — gating", () => {
  it("returns nothing for non-billable status", () => {
    expect(plan({ contract: contract({ status: "ended" }) })).toEqual([]);
    expect(plan({ contract: contract({ status: "draft" }) })).toEqual([]);
  });

  it("bills cancelled contracts (they can still owe arrears)", () => {
    const invoices = plan({ contract: contract({ status: "cancelled" }) });
    expect(invoices).toHaveLength(1);
  });

  it("returns nothing when the contract hasn't started", () => {
    expect(
      plan({
        contract: contract({ startDate: "2026-02-01" }),
        targetMonth: "2026-01-01",
      }),
    ).toEqual([]);
  });

  it("returns nothing when there are no charges at all", () => {
    expect(plan({ hasMembershipCharges: false })).toEqual([]);
  });
});

describe("planContractBilling — simple current month", () => {
  it("produces a single current invoice", () => {
    expect(plan()).toEqual([
      {
        month: "2026-01-01",
        role: "current",
        chargeJoiningFee: false,
        chargeYearlyFee: false,
      },
    ]);
  });

  it("is idempotent — skips a month already invoiced", () => {
    expect(plan({ existingMonths: new Set(["2026-01-01"]) })).toEqual([]);
  });
});

describe("planContractBilling — joining fee", () => {
  it("charges joining on the current month when unpaid and > 0", () => {
    const [inv] = plan({
      contract: contract({ joiningFeeCents: 5000, joiningFeePaid: false }),
    });
    expect(inv?.chargeJoiningFee).toBe(true);
  });

  it("does not charge joining when already paid", () => {
    const [inv] = plan({
      contract: contract({ joiningFeeCents: 5000, joiningFeePaid: true }),
    });
    expect(inv?.chargeJoiningFee).toBe(false);
  });

  it("does not charge joining when the amount is 0/null", () => {
    expect(plan({ contract: contract({ joiningFeeCents: 0 }) })[0]?.chargeJoiningFee).toBe(false);
    expect(plan({ contract: contract({ joiningFeeCents: null }) })[0]?.chargeJoiningFee).toBe(
      false,
    );
  });

  it("never charges joining on an arrears/waived month", () => {
    // target Mar, missing Jan..Mar → Jan waived, Feb arrears, Mar current
    const invoices = plan({
      contract: contract({ joiningFeeCents: 5000, joiningFeePaid: false }),
      targetMonth: "2026-03-01",
    });
    const joiningMonths = invoices.filter((i) => i.chargeJoiningFee);
    expect(joiningMonths).toHaveLength(1);
    expect(joiningMonths[0]?.month).toBe("2026-03-01");
    expect(joiningMonths[0]?.role).toBe("current");
  });
});

describe("planContractBilling — arrears / waive split", () => {
  it("makes the most recent missed month arrears and older ones waived", () => {
    // start Jan, target Apr, nothing billed → Jan,Feb waived; Mar arrears; Apr current
    const invoices = plan({ targetMonth: "2026-04-01" });
    expect(invoices.map((i) => [i.month, i.role])).toEqual([
      ["2026-01-01", "waived"],
      ["2026-02-01", "waived"],
      ["2026-03-01", "arrears"],
      ["2026-04-01", "current"],
    ]);
  });

  it("only the current month exists when there is no gap", () => {
    const invoices = plan({
      contract: contract({ startDate: "2026-04-01" }),
      targetMonth: "2026-04-01",
    });
    expect(invoices.map((i) => i.role)).toEqual(["current"]);
  });

  it("respects already-invoiced months when choosing the arrears month", () => {
    // Feb already billed → missing Jan,Mar,Apr; historical missed Jan,Mar → Mar arrears, Jan waived
    const invoices = plan({
      targetMonth: "2026-04-01",
      existingMonths: new Set(["2026-02-01"]),
    });
    expect(invoices.map((i) => [i.month, i.role])).toEqual([
      ["2026-01-01", "waived"],
      ["2026-03-01", "arrears"],
      ["2026-04-01", "current"],
    ]);
  });
});

describe("planContractBilling — settledThroughDate", () => {
  it("starts billing the month after settledThroughDate", () => {
    // settled through Feb → first billable Mar; target Apr → Mar arrears, Apr current
    const invoices = plan({
      contract: contract({ settledThroughDate: "2026-02-15" }),
      targetMonth: "2026-04-01",
    });
    expect(invoices.map((i) => [i.month, i.role])).toEqual([
      ["2026-03-01", "arrears"],
      ["2026-04-01", "current"],
    ]);
  });
});

describe("planContractBilling — cancellation cutoff", () => {
  it("does not bill past the cancellation month", () => {
    // cancelled effective Feb, target Apr → only Jan, Feb billable (Jan waived, Feb arrears)
    const invoices = plan({
      contract: contract({
        status: "cancelled",
        cancellationEffectiveDate: "2026-02-20",
      }),
      targetMonth: "2026-04-01",
    });
    expect(invoices.map((i) => [i.month, i.role])).toEqual([
      ["2026-01-01", "waived"],
      ["2026-02-01", "arrears"],
    ]);
  });

  it("still bills the target month when cancellation is in the future", () => {
    const invoices = plan({
      contract: contract({
        status: "cancelled",
        cancellationEffectiveDate: "2026-06-30",
      }),
      targetMonth: "2026-03-01",
    });
    expect(invoices.map((i) => i.month)).toContain("2026-03-01");
  });
});

describe("planContractBilling — yearly fee", () => {
  it("charges the yearly fee in January (january mode), once", () => {
    const invoices = plan({
      contract: contract({ yearlyFeeCents: 12000, yearlyFeeMode: "january" }),
      targetMonth: "2026-01-01",
    });
    expect(invoices[0]?.chargeYearlyFee).toBe(true);
  });

  it("does not charge a yearly fee whose cycle is already billed", () => {
    const invoices = plan({
      contract: contract({ yearlyFeeCents: 12000, yearlyFeeMode: "january" }),
      targetMonth: "2026-01-01",
      billedYearlyCycles: new Set(["2026"]),
    });
    expect(invoices[0]?.chargeYearlyFee).toBe(false);
  });

  it("charges in the start month for anniversary mode", () => {
    const invoices = plan({
      contract: contract({
        startDate: "2026-03-01",
        yearlyFeeCents: 9000,
        yearlyFeeMode: "anniversary",
      }),
      targetMonth: "2026-03-01",
    });
    expect(invoices[0]?.chargeYearlyFee).toBe(true);
  });

  it("does not double-charge within a single cycle across multiple months", () => {
    // anniversary March, target Apr, nothing billed → Mar (arrears) charges yearly, Apr (current) does not
    const invoices = plan({
      contract: contract({
        startDate: "2026-03-01",
        yearlyFeeCents: 9000,
        yearlyFeeMode: "anniversary",
      }),
      targetMonth: "2026-04-01",
    });
    const yearlyMonths = invoices.filter((i) => i.chargeYearlyFee);
    expect(yearlyMonths.map((i) => i.month)).toEqual(["2026-03-01"]);
  });

  it("charges separate yearly fees in distinct cycles", () => {
    // anniversary March, span Mar 2026 .. Mar 2027 → two cycles, two yearly fees
    const invoices = plan({
      contract: contract({
        startDate: "2026-03-01",
        yearlyFeeCents: 9000,
        yearlyFeeMode: "anniversary",
      }),
      targetMonth: "2027-03-01",
    });
    const yearlyMonths = invoices.filter((i) => i.chargeYearlyFee).map((i) => i.month);
    expect(yearlyMonths).toEqual(["2026-03-01", "2027-03-01"]);
  });

  it("a waived month still consumes the yearly cycle (faithful wt quirk)", () => {
    // january mode, target Mar, nothing billed → Jan waived, Feb arrears, Mar current.
    // Jan is the trigger month → yearly charged on the WAIVED Jan invoice, cycle consumed.
    const invoices = plan({
      contract: contract({ yearlyFeeCents: 12000, yearlyFeeMode: "january" }),
      targetMonth: "2026-03-01",
    });
    const jan = invoices.find((i) => i.month === "2026-01-01");
    expect(jan?.role).toBe("waived");
    expect(jan?.chargeYearlyFee).toBe(true);
    expect(invoices.filter((i) => i.chargeYearlyFee)).toHaveLength(1);
  });

  it("emits an otherwise-empty month if only the yearly fee is due", () => {
    // no membership charges, but January with a yearly fee → still one invoice
    const invoices = plan({
      hasMembershipCharges: false,
      contract: contract({ yearlyFeeCents: 12000, yearlyFeeMode: "january" }),
      targetMonth: "2026-01-01",
    });
    expect(invoices).toHaveLength(1);
    expect(invoices[0]?.chargeYearlyFee).toBe(true);
  });
});
