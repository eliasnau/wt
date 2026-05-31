import { ymdInBerlin } from "../../domain/members/cancellation";
import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import {
  countActiveContractsAsOf,
  loadActiveGroupMix,
  sumActiveMembershipValueCents,
  sumDraftCents,
  sumOutstandingCents,
} from "../../queries/statistics";

/**
 * Current-state KPIs ("as of now"): member stocks and money balances. Flows
 * over time live in `timeline`. All money is integer cents.
 */
export const getSnapshot = orgProcedure
  .meta({ cost: 2 })
  .use(requirePermission({ statistics: ["view"], financeStatistics: ["view"] }))
  .handler(async ({ context }) => {
    const asOf = ymdInBerlin(new Date());
    const organizationId = context.organizationId;

    const [
      activeMembers,
      groupMix,
      outstandingCents,
      draftCents,
      activeMembershipValueCents,
    ] = await Promise.all([
      countActiveContractsAsOf(organizationId, asOf),
      loadActiveGroupMix(organizationId),
      sumOutstandingCents(organizationId),
      sumDraftCents(organizationId),
      sumActiveMembershipValueCents(organizationId),
    ]);

    context.log?.set({
      data: {
        statistics: {
          activeMembers,
          outstandingCents,
          groupCount: groupMix.length,
        },
      },
    });

    return {
      asOf,
      members: {
        active: activeMembers,
        byGroup: groupMix.sort((a, b) => b.count - a.count),
      },
      revenue: {
        outstandingCents,
        draftCents,
        activeMembershipValueCents,
      },
    };
  })
  .route({ method: "GET", path: "/statistics/snapshot" });
