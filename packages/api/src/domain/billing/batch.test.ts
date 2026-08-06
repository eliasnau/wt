import { describe, expect, it } from "vitest";

import { buildBatchNumber, isActiveBatchStatus, partitionEligibleInvoices } from "./batch";

describe("buildBatchNumber", () => {
  it("formats date + 2-digit sequence + 8-char upper org prefix", () => {
    expect(buildBatchNumber("abcd1234efgh", "2026-05-01", 3)).toBe("2026-05-01-03-ABCD1234");
  });
});

describe("isActiveBatchStatus", () => {
  it("treats generated/downloaded as active, others not", () => {
    expect(isActiveBatchStatus("generated")).toBe(true);
    expect(isActiveBatchStatus("downloaded")).toBe(true);
    expect(isActiveBatchStatus("void")).toBe(false);
    expect(isActiveBatchStatus("superseded")).toBe(false);
  });
});

describe("partitionEligibleInvoices", () => {
  const invoices = [
    { id: "i1", contractId: "c1", totalCents: 1000 },
    { id: "i2", contractId: "c2", totalCents: 2000 },
    { id: "i3", contractId: "c3", totalCents: 3000 },
  ];

  it("includes invoices with an active mandate and excludes the rest", () => {
    const result = partitionEligibleInvoices({
      invoices,
      exportedInvoiceIds: new Set(["i2"]), // already exported
      mandateIdByContractId: new Map([
        ["c1", "m1"],
        // c3 has no mandate
      ]),
    });

    expect(result.included).toEqual([
      { id: "i1", contractId: "c1", totalCents: 1000, sepaMandateId: "m1" },
    ]);
    expect(result.excluded).toEqual([
      { id: "i2", contractId: "c2", totalCents: 2000, reason: "already_exported" },
      { id: "i3", contractId: "c3", totalCents: 3000, reason: "missing_active_mandate" },
    ]);
  });

  it("prioritizes already_exported over missing_active_mandate", () => {
    const result = partitionEligibleInvoices({
      invoices: [{ id: "i1", contractId: "c1", totalCents: 1000 }],
      exportedInvoiceIds: new Set(["i1"]),
      mandateIdByContractId: new Map(), // also missing mandate
    });
    expect(result.excluded[0]?.reason).toBe("already_exported");
  });
});
