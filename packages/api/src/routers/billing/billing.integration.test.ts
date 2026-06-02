import {
  clubMember,
  contract,
  creditGrant,
  group,
  groupMember,
  invoice,
  invoiceLine,
  organization,
  sepaMandate,
} from "@matdesk/db/schema";
import { eq } from "@matdesk/db";
import { beforeEach, describe, expect, it } from "vitest";

import { buildBatchNumber, partitionEligibleInvoices } from "../../domain/billing/batch";
import { creditRestorations } from "../../domain/billing/credits";
import {
  acquireOrgGenerationLock,
  applyGrantUpdates,
  insertBatchWithItems,
  loadBatchEligibility,
  nextBatchSequenceNumber,
} from "../../queries/billing";
import { createTestDb, type TestDb } from "../../../test/helpers/pg";
import { generateInvoicesForMonth } from "./engine";

let db: TestDb;

const ORG = "org-test";

beforeEach(async () => {
  ({ db } = await createTestDb());
  await db.insert(organization).values({ id: ORG, name: "Test Dojo", slug: ORG });
});

async function seedMember(overrides?: { firstName?: string }) {
  const [member] = await db
    .insert(clubMember)
    .values({
      organizationId: ORG,
      firstName: overrides?.firstName ?? "Max",
      lastName: "Mustermann",
      street: "Hauptstr 1",
      city: "Berlin",
      state: "BE",
      postalCode: "10115",
      country: "DE",
      iban: "DE89370400440532013000",
      bic: "COBADEFFXXX",
      cardHolder: "Max Mustermann",
    })
    .returning();
  return member!;
}

async function seedContract(
  memberId: string,
  overrides: Partial<typeof contract.$inferInsert> = {},
) {
  const [row] = await db
    .insert(contract)
    .values({
      organizationId: ORG,
      memberId,
      initialPeriod: "monthly",
      startDate: "2026-03-01",
      initialPeriodEndDate: "2026-03-31",
      ...overrides,
    })
    .returning();
  return row!;
}

async function seedGroupMembership(memberId: string, priceCents: number) {
  const [g] = await db.insert(group).values({ organizationId: ORG, name: "Karate" }).returning();
  await db.insert(groupMember).values({
    groupId: g!.id,
    memberId,
    membershipPriceCents: priceCents,
    startDate: "2026-03-01",
  });
  return g!;
}

function generate(targetMonth: string) {
  return db.transaction((tx) =>
    generateInvoicesForMonth(tx, {
      organizationId: ORG,
      targetMonth,
      currency: "EUR",
    }),
  );
}

async function linesFor(invoiceId: string) {
  return db.select().from(invoiceLine).where(eq(invoiceLine.invoiceId, invoiceId));
}

describe("billing integration — invoice generation", () => {
  it("creates one finalized invoice for the current month", async () => {
    const member = await seedMember();
    await seedContract(member.id);
    await seedGroupMembership(member.id, 5000);

    const created = await generate("2026-03-01");

    expect(created).toHaveLength(1);
    expect(created[0]?.status).toBe("finalized");
    expect(created[0]?.totalCents).toBe(5000);

    const lines = await linesFor(created[0]!.id);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.type).toBe("membership_fee");
    expect(lines[0]?.totalAmountCents).toBe(5000);
  });

  it("is idempotent — a second run for the same month creates nothing", async () => {
    const member = await seedMember();
    await seedContract(member.id);
    await seedGroupMembership(member.id, 5000);

    await generate("2026-03-01");
    const second = await generate("2026-03-01");

    expect(second).toHaveLength(0);
    const all = await db.select().from(invoice).where(eq(invoice.organizationId, ORG));
    expect(all).toHaveLength(1);
  });

  it("splits a multi-month gap into waived + arrears + current", async () => {
    const member = await seedMember();
    await seedContract(member.id, { startDate: "2026-01-01" });
    await seedGroupMembership(member.id, 5000);

    const created = await generate("2026-03-01");

    // Jan waived (net zero), Feb arrears, Mar current
    expect(created).toHaveLength(3);
    const byMonth = new Map(created.map((i) => [i.billingPeriodStart, i]));
    expect(byMonth.get("2026-01-01")?.totalCents).toBe(0); // waived nets to zero
    expect(byMonth.get("2026-02-01")?.totalCents).toBe(5000); // arrears collectible
    expect(byMonth.get("2026-03-01")?.totalCents).toBe(5000); // current

    const febLines = await linesFor(byMonth.get("2026-02-01")!.id);
    expect(febLines.some((l) => l.type === "arrears")).toBe(true);
    const janLines = await linesFor(byMonth.get("2026-01-01")!.id);
    expect(janLines.some((l) => l.type === "waiver")).toBe(true);
  });

  it("charges the joining fee once and flips joiningFeePaid", async () => {
    const member = await seedMember();
    const c = await seedContract(member.id, { joiningFeeCents: 3000 });
    await seedGroupMembership(member.id, 5000);

    const created = await generate("2026-03-01");
    expect(created[0]?.totalCents).toBe(8000);
    const lines = await linesFor(created[0]!.id);
    expect(lines.some((l) => l.type === "joining_fee")).toBe(true);

    const [after] = await db.select().from(contract).where(eq(contract.id, c.id));
    expect(after?.joiningFeePaid).toBe(true);
  });
});

describe("billing integration — yearly fee", () => {
  it("bills the yearly fee once, then never again for the same cycle", async () => {
    const member = await seedMember();
    await seedContract(member.id, {
      startDate: "2026-01-01",
      initialPeriodEndDate: "2026-01-31",
      yearlyFeeCents: 12000,
      yearlyFeeMode: "january",
    });
    await seedGroupMembership(member.id, 5000);

    // January: membership + yearly fee.
    const jan = await generate("2026-01-01");
    expect(jan[0]?.totalCents).toBe(17000);
    const janLines = await linesFor(jan[0]!.id);
    expect(janLines.some((l) => l.type === "yearly_fee" && l.totalAmountCents === 12000)).toBe(
      true,
    );

    // February: membership only — the cycle's yearly fee was already billed.
    const feb = await generate("2026-02-01");
    expect(feb[0]?.totalCents).toBe(5000);
    const febLines = await linesFor(feb[0]!.id);
    expect(febLines.some((l) => l.type === "yearly_fee")).toBe(false);
  });

  it("charges the anniversary yearly fee in the contract's start month", async () => {
    const member = await seedMember();
    await seedContract(member.id, {
      startDate: "2026-03-01",
      yearlyFeeCents: 9000,
      yearlyFeeMode: "anniversary",
    });
    await seedGroupMembership(member.id, 5000);

    const created = await generate("2026-03-01");
    expect(created[0]?.totalCents).toBe(14000);
    const lines = await linesFor(created[0]!.id);
    expect(lines.some((l) => l.type === "yearly_fee")).toBe(true);
  });
});

describe("billing integration — credits", () => {
  it("applies a money credit and decrements the grant", async () => {
    const member = await seedMember();
    const c = await seedContract(member.id);
    await seedGroupMembership(member.id, 5000);
    const [grant] = await db
      .insert(creditGrant)
      .values({
        organizationId: ORG,
        memberId: member.id,
        contractId: c.id,
        type: "money",
        originalAmountCents: 3000,
        remainingAmountCents: 3000,
      })
      .returning();

    const created = await generate("2026-03-01");
    expect(created[0]?.totalCents).toBe(2000); // 5000 − 3000

    const lines = await linesFor(created[0]!.id);
    expect(lines.some((l) => l.type === "credit_money" && l.totalAmountCents === -3000)).toBe(true);

    const [afterGrant] = await db.select().from(creditGrant).where(eq(creditGrant.id, grant!.id));
    expect(afterGrant?.remainingAmountCents).toBe(0);
  });

  it("restores a grant when its invoice's credit lines are reverted", async () => {
    const member = await seedMember();
    const c = await seedContract(member.id);
    await seedGroupMembership(member.id, 5000);
    const [grant] = await db
      .insert(creditGrant)
      .values({
        organizationId: ORG,
        memberId: member.id,
        contractId: c.id,
        type: "money",
        originalAmountCents: 3000,
        remainingAmountCents: 3000,
      })
      .returning();

    const created = await generate("2026-03-01");
    const lines = await linesFor(created[0]!.id);

    await db.transaction((tx) => applyGrantUpdates(tx, creditRestorations(lines)));

    const [afterGrant] = await db.select().from(creditGrant).where(eq(creditGrant.id, grant!.id));
    expect(afterGrant?.remainingAmountCents).toBe(3000);
  });
});

describe("billing integration — mandate constraint", () => {
  it("rejects a second active mandate for the same contract (partial unique index)", async () => {
    const member = await seedMember();
    const c = await seedContract(member.id);

    const insertActive = (reference: string) =>
      db.insert(sepaMandate).values({
        organizationId: ORG,
        memberId: member.id,
        contractId: c.id,
        mandateReference: reference,
        accountHolder: "Max Mustermann",
        iban: "DE89370400440532013000",
        bic: "COBADEFFXXX",
        signatureDate: "2026-02-01",
        isActive: true,
      });

    await insertActive("MD-A");
    await expect(insertActive("MD-B")).rejects.toThrow();
  });
});

describe("billing integration — advisory lock", () => {
  it("acquires the per-org generation lock and still generates correctly", async () => {
    const member = await seedMember();
    await seedContract(member.id);
    await seedGroupMembership(member.id, 5000);

    // Mirror the real procedure: lock then generate, in one transaction.
    const created = await db.transaction(async (tx) => {
      await acquireOrgGenerationLock(tx, ORG);
      return generateInvoicesForMonth(tx, {
        organizationId: ORG,
        targetMonth: "2026-03-01",
        currency: "EUR",
      });
    });
    expect(created).toHaveLength(1);
  });
});

describe("billing integration — SEPA batch", () => {
  async function seedMandate(memberId: string, contractId: string) {
    await db.insert(sepaMandate).values({
      organizationId: ORG,
      memberId,
      contractId,
      mandateReference: "MD-TEST-0001",
      accountHolder: "Max Mustermann",
      iban: "DE89370400440532013000",
      bic: "COBADEFFXXX",
      signatureDate: "2026-02-01",
      isActive: true,
    });
  }

  it("excludes invoices without an active mandate", async () => {
    const member = await seedMember();
    await seedContract(member.id);
    await seedGroupMembership(member.id, 5000);
    await generate("2026-03-01");

    const data = await loadBatchEligibility(db, ORG);
    const part = partitionEligibleInvoices({
      invoices: data.invoices,
      exportedInvoiceIds: data.exportedInvoiceIds,
      mandateIdByContractId: data.mandateIdByContractId,
    });
    expect(part.included).toHaveLength(0);
    expect(part.excluded[0]?.reason).toBe("missing_active_mandate");
  });

  it("includes a mandated invoice, then excludes it once batched", async () => {
    const member = await seedMember();
    const c = await seedContract(member.id);
    await seedGroupMembership(member.id, 5000);
    await generate("2026-03-01");
    await seedMandate(member.id, c.id);

    // Eligible now that a mandate exists.
    const data = await loadBatchEligibility(db, ORG);
    const part = partitionEligibleInvoices({
      invoices: data.invoices,
      exportedInvoiceIds: data.exportedInvoiceIds,
      mandateIdByContractId: data.mandateIdByContractId,
    });
    expect(part.included).toHaveLength(1);

    // Create the batch (sequence under advisory lock).
    const batch = await db.transaction(async (tx) => {
      const seq = await nextBatchSequenceNumber(tx, ORG, "2026-03-15");
      return insertBatchWithItems(tx, {
        batch: {
          organizationId: ORG,
          collectionDate: "2026-03-15",
          sequenceNumber: seq,
          batchNumber: buildBatchNumber(ORG, "2026-03-15", seq),
          status: "generated",
          totalAmountCents: part.included.reduce((s, i) => s + i.totalCents, 0),
          transactionCount: part.included.length,
        },
        items: part.included.map((inv) => ({
          organizationId: ORG,
          invoiceId: inv.id,
          sepaMandateId: inv.sepaMandateId,
          amountCents: inv.totalCents,
          status: "included",
        })),
      });
    });
    expect(batch.transactionCount).toBe(1);
    expect(batch.sequenceNumber).toBe(1);

    // The invoice is now in a generated batch → excluded from re-export.
    const after = await loadBatchEligibility(db, ORG);
    const afterPart = partitionEligibleInvoices({
      invoices: after.invoices,
      exportedInvoiceIds: after.exportedInvoiceIds,
      mandateIdByContractId: after.mandateIdByContractId,
    });
    expect(afterPart.included).toHaveLength(0);
    expect(afterPart.excluded[0]?.reason).toBe("already_exported");
  });
});
