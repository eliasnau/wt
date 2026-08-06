import { createCreditGrant } from "./create-credit-grant";
import { createSepaMandate } from "./create-sepa-mandate";
import { downloadSepaBatch } from "./download-sepa-batch";
import { generateInvoices } from "./generate-invoices";
import { generateSepaBatch } from "./generate-sepa-batch";
import { getInvoice } from "./get-invoice";
import { getSepaBatch } from "./get-sepa-batch";
import { getSepaSettings } from "./get-sepa-settings";
import { listCreditGrants } from "./list-credit-grants";
import { listInvoices } from "./list-invoices";
import { listSepaBatches } from "./list-sepa-batches";
import { listSepaMandates } from "./list-sepa-mandates";
import { markSepaBatchDownloaded } from "./mark-sepa-batch-downloaded";
import { previewSepaBatch } from "./preview-sepa-batch";
import { prepareSepaCollection } from "./prepare-sepa-collection";
import { replaceInvoice } from "./replace-invoice";
import { revokeCreditGrant } from "./revoke-credit-grant";
import { revokeSepaMandate } from "./revoke-sepa-mandate";
import { supersedeSepaBatch } from "./supersede-sepa-batch";
import { updateSepaSettings } from "./update-sepa-settings";
import { voidInvoice } from "./void-invoice";
import { voidSepaBatch } from "./void-sepa-batch";

export const billingRouter = {
  // Invoices
  generateInvoices,
  listInvoices,
  getInvoice,
  voidInvoice,
  replaceInvoice,
  // Credit grants
  createCreditGrant,
  listCreditGrants,
  revokeCreditGrant,
  // SEPA mandates
  createSepaMandate,
  listSepaMandates,
  revokeSepaMandate,
  // SEPA batches
  listSepaBatches,
  previewSepaBatch,
  prepareSepaCollection,
  generateSepaBatch,
  getSepaBatch,
  downloadSepaBatch,
  markSepaBatchDownloaded,
  voidSepaBatch,
  supersedeSepaBatch,
  // SEPA settings
  getSepaSettings,
  updateSepaSettings,
};
