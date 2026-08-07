import { transactionDb } from "@matdesk/db";
import { z } from "zod";

import { orgProcedure } from "../../index";
import { requirePermission } from "../../middlewares/permissions";
import { prepareSepaCollection as prepareCollection } from "./collection-engine";
import { ymdSchema } from "./schemas";

export const prepareSepaCollection = orgProcedure
  .meta({ cost: 15 })
  .use(requirePermission({ billing: ["generate", "download"] }))
  .input(z.object({ collectionDate: ymdSchema }))
  .handler(async ({ input, context }) => {
    const result = await transactionDb.transaction((tx) =>
      prepareCollection(tx, {
        organizationId: context.organizationId,
        collectionDate: input.collectionDate,
      }),
    );

    context.log?.set({
      data: {
        sepaCollection: {
          batchId: result.batch.id,
          batchNumber: result.batch.batchNumber,
          collectionDate: input.collectionDate,
          createdInvoiceCount: result.createdInvoiceCount,
          transactionCount: result.batch.transactionCount,
        },
      },
    });

    return result;
  })
  .route({ method: "POST", path: "/billing/sepa-collections/prepare" });
