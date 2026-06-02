import { defineErrorCatalog } from "evlog";

export const billingErrors = defineErrorCatalog("billing", {
  INVOICE_NOT_FOUND: {
    status: 404,
    message: "Invoice not found",
    why: "The invoice doesn't exist or belongs to another organization.",
    fix: "Refresh the invoice list and try again.",
  },
  INVOICE_ALREADY_VOID: {
    status: 400,
    message: "Invoice is already void",
    why: "You can't void or replace an invoice that's already void.",
    fix: "Pick a non-void invoice.",
  },
  INVOICE_EXPORTED: {
    status: 400,
    message: "Exported invoices cannot be changed",
    why: "The invoice is part of an active SEPA batch, so it can't be voided or replaced directly.",
    fix: "Void or supersede the SEPA batch first, then change the invoice.",
  },
  MEMBER_OR_CONTRACT_NOT_FOUND: {
    status: 404,
    message: "Member or contract not found",
    why: "The member/contract pair doesn't exist in this organization.",
    fix: "Check the member and contract ids and try again.",
  },
  MANDATE_NOT_FOUND: {
    status: 404,
    message: "SEPA mandate not found",
    why: "The mandate doesn't exist or belongs to another organization.",
    fix: "Refresh the mandate list and try again.",
  },
  NO_ELIGIBLE_INVOICES: {
    status: 400,
    message: "No eligible invoices for SEPA export",
    why: "Every finalized invoice is either already exported or missing an active mandate.",
    fix: "Generate invoices and ensure members have active mandates, then retry.",
  },
  BATCH_NOT_FOUND: {
    status: 404,
    message: "SEPA batch not found",
    why: "The batch doesn't exist or belongs to another organization.",
    fix: "Refresh the batch list and try again.",
  },
  BATCH_NOT_DOWNLOADABLE: {
    status: 400,
    message: "SEPA batch is not available for download",
    why: "Only generated or downloaded batches can be exported to XML.",
    fix: "Generate a new batch.",
  },
  BATCH_NO_INCLUDED_INVOICES: {
    status: 400,
    message: "SEPA batch has no included invoices",
    why: "The batch contains no invoices to export.",
    fix: "Generate a new batch with eligible invoices.",
  },
  BATCH_INVALID_STATE: {
    status: 400,
    message: "SEPA batch is not in the required state",
    why: "The batch's current status doesn't allow this transition.",
    fix: "Refresh the batch and retry the appropriate action.",
  },
  MISSING_MANDATE_FOR_INVOICE: {
    status: 400,
    message: "Missing active mandate for an exported invoice",
    why: "An invoice in the batch no longer has an active mandate, so the XML can't be built.",
    fix: "Restore or recreate the member's mandate, or supersede the batch.",
  },
  SEPA_SETTINGS_MISSING: {
    status: 400,
    message: "SEPA settings are not configured",
    why: "The organization has no creditor details set.",
    fix: "Add creditor details under Settings → SEPA.",
  },
  SEPA_SETTINGS_INCOMPLETE: {
    status: 400,
    message: "SEPA settings are incomplete",
    why: "Creditor name, IBAN, BIC, and creditor ID are all required for export.",
    fix: "Complete the creditor details under Settings → SEPA.",
  },
  INVALID_CREDITOR_DETAILS: {
    status: 400,
    message: "Invalid creditor details",
    why: "The configured creditor IBAN, BIC, or creditor ID failed validation.",
    fix: "Correct the creditor details under Settings → SEPA.",
  },
  INVALID_IBAN: {
    status: 400,
    message: "Invalid IBAN",
    why: "The provided IBAN failed checksum/format validation.",
    fix: "Check the IBAN and try again.",
  },
});
