import { describe, expect, it } from "vitest";

import { buildMonthLines, type GroupCharge, sumLines } from "./lines";

const ORG = "org-1";
const contract = {
  joiningFeeCents: 5000,
  yearlyFeeCents: 12000,
  yearlyFeeMode: "january",
};
const groups: GroupCharge[] = [
  { groupId: "g1", groupName: "Karate", membershipPriceCents: 4000 },
  { groupId: "g2", groupName: "Yoga", membershipPriceCents: 3000 },
];

describe("buildMonthLines — current month", () => {
  it("builds membership lines per group with month coverage", () => {
    const lines = buildMonthLines({
      organizationId: ORG,
      contract,
      month: "2026-05-01",
      role: "current",
      groupCharges: groups,
      chargeJoiningFee: false,
      chargeYearlyFee: false,
    });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      type: "membership_fee",
      description: "Membership fee: Karate",
      totalAmountCents: 4000,
      coverageStart: "2026-05-01",
      coverageEnd: "2026-05-31",
      groupId: "g1",
    });
    expect(sumLines(lines)).toBe(7000);
  });

  it("adds joining and yearly fees when flagged and > 0", () => {
    const lines = buildMonthLines({
      organizationId: ORG,
      contract,
      month: "2026-01-01",
      role: "current",
      groupCharges: groups,
      chargeJoiningFee: true,
      chargeYearlyFee: true,
    });
    expect(lines.map((l) => l.type)).toEqual([
      "membership_fee",
      "membership_fee",
      "joining_fee",
      "yearly_fee",
    ]);
    expect(sumLines(lines)).toBe(7000 + 5000 + 12000);
  });

  it("omits joining/yearly when their amount is 0/null even if flagged", () => {
    const lines = buildMonthLines({
      organizationId: ORG,
      contract: { joiningFeeCents: 0, yearlyFeeCents: null, yearlyFeeMode: "january" },
      month: "2026-01-01",
      role: "current",
      groupCharges: [],
      chargeJoiningFee: true,
      chargeYearlyFee: true,
    });
    expect(lines).toEqual([]);
  });

  it("labels anniversary yearly fees", () => {
    const lines = buildMonthLines({
      organizationId: ORG,
      contract: { ...contract, yearlyFeeMode: "anniversary" },
      month: "2026-03-01",
      role: "current",
      groupCharges: [],
      chargeJoiningFee: false,
      chargeYearlyFee: true,
    });
    expect(lines[0]?.description).toBe("Annual fee (anniversary)");
  });
});

describe("buildMonthLines — arrears", () => {
  it("converts membership_fee to arrears and relabels all lines", () => {
    const lines = buildMonthLines({
      organizationId: ORG,
      contract,
      month: "2026-03-01",
      role: "arrears",
      groupCharges: groups,
      chargeJoiningFee: false,
      chargeYearlyFee: true, // yearly can land on an arrears month
    });
    expect(lines.map((l) => l.type)).toEqual([
      "arrears",
      "arrears",
      "yearly_fee", // type unchanged, only membership becomes arrears
    ]);
    expect(lines[0]?.description).toBe("Arrears for March 2026: Membership fee: Karate");
    expect(lines[2]?.description).toBe("Arrears for March 2026: Annual fee (January)");
    expect(sumLines(lines)).toBe(7000 + 12000);
  });
});

describe("buildMonthLines — waived", () => {
  it("mirrors each positive line with a negative waiver, netting to zero", () => {
    const lines = buildMonthLines({
      organizationId: ORG,
      contract,
      month: "2026-02-01",
      role: "waived",
      groupCharges: groups,
      chargeJoiningFee: false,
      chargeYearlyFee: false,
    });
    expect(lines).toHaveLength(4); // 2 membership + 2 waiver
    expect(lines.slice(2).map((l) => l.type)).toEqual(["waiver", "waiver"]);
    expect(lines[2]?.totalAmountCents).toBe(-4000);
    expect(lines[2]?.description).toBe("Waived charge for February 2026: Membership fee: Karate");
    expect(sumLines(lines)).toBe(0);
  });

  it("returns nothing for a month with no base charges", () => {
    expect(
      buildMonthLines({
        organizationId: ORG,
        contract: { joiningFeeCents: 0, yearlyFeeCents: 0, yearlyFeeMode: "january" },
        month: "2026-02-01",
        role: "waived",
        groupCharges: [],
        chargeJoiningFee: false,
        chargeYearlyFee: false,
      }),
    ).toEqual([]);
  });
});
