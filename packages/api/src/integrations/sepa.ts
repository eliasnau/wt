/**
 * SEPA direct-debit XML export.
 *
 * The `sepa` npm package builds the pain.008 XML. This module owns the bridge:
 * validating creditor settings, mapping the org-settings row, and rendering the
 * document from already-loaded data. All DB reads happen in the query layer —
 * this function is given the batch, items, mandates, and settings, and returns
 * the XML string. Configuration/validation failures throw cataloged
 * `billingErrors` (genuine user-facing config problems).
 */

import type { InferSelectModel } from "@matdesk/db";
import type { organizationSettings } from "@matdesk/db/schema";

import { billingErrors } from "../errors";

/**
 * The `sepa` package ships a `declare module "sepa"` with named exports
 * (`Document`, `validateIBAN`, `validateCreditorID`, …) and no default — so its
 * shape is `typeof import("sepa")`. It previously imported a `SepaStatic` type
 * that the package doesn't export, which was a hard typecheck failure.
 */
type SepaModule = typeof import("sepa");

const BIC_REGEX = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;

/** Canonical IBAN/BIC/creditor-id form: no whitespace, uppercase. Stored and
 *  validated in this form so a save can never pass validation but fail export. */
export function normalizeSepaIdentifier(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export type OrganizationSettingsRow = InferSelectModel<typeof organizationSettings>;

export type SepaSettings = {
  creditorName?: string;
  creditorIban?: string;
  creditorBic?: string;
  creditorId?: string;
  initiatorName?: string;
  batchBooking?: boolean;
};

export type SepaSettingsRequiredCore = SepaSettings & {
  creditorName: string;
  creditorIban: string;
  creditorBic: string;
  creditorId: string;
};

export function mapSepaRowToSettings(row: OrganizationSettingsRow): SepaSettings {
  // Normalize identifiers on read too, so even rows stored before normalization
  // validate and export consistently.
  return {
    creditorName: row.creditorName ?? undefined,
    creditorIban: row.creditorIban ? normalizeSepaIdentifier(row.creditorIban) : undefined,
    creditorBic: row.creditorBic ? normalizeSepaIdentifier(row.creditorBic) : undefined,
    creditorId: row.creditorId ? normalizeSepaIdentifier(row.creditorId) : undefined,
    initiatorName: row.initiatorName ?? undefined,
    batchBooking: row.batchBooking ?? undefined,
  };
}

/** Require complete creditor core fields. Throws cataloged errors when missing. */
export function requireSepaSettings(
  row: OrganizationSettingsRow | null | undefined,
): SepaSettingsRequiredCore {
  if (!row) {
    throw billingErrors.SEPA_SETTINGS_MISSING();
  }
  const settings = mapSepaRowToSettings(row);
  if (
    !settings.creditorName ||
    !settings.creditorIban ||
    !settings.creditorBic ||
    !settings.creditorId
  ) {
    throw billingErrors.SEPA_SETTINGS_INCOMPLETE({
      internal: {
        hasName: Boolean(settings.creditorName),
        hasIban: Boolean(settings.creditorIban),
        hasBic: Boolean(settings.creditorBic),
        hasCreditorId: Boolean(settings.creditorId),
      },
    });
  }
  return settings as SepaSettingsRequiredCore;
}

async function loadSepaModule(): Promise<SepaModule> {
  const sepaModule = await import("sepa");
  return (
    (sepaModule as unknown as { default?: SepaModule }).default ??
    (sepaModule as unknown as SepaModule)
  );
}

/** Checksum-validate an IBAN (length + country + mod-97). */
export async function validateIban(iban: string): Promise<boolean> {
  const sepa = await loadSepaModule();
  return sepa.validateIBAN(normalizeSepaIdentifier(iban));
}

/**
 * Validate whichever creditor fields are present (for partial settings saves).
 * Throws `INVALID_CREDITOR_DETAILS` on the first failure.
 */
export async function assertValidCreditorSettings(settings: {
  creditorIban?: string | null;
  creditorBic?: string | null;
  creditorId?: string | null;
}): Promise<void> {
  const sepa = await loadSepaModule();

  if (settings.creditorIban && !sepa.validateIBAN(normalizeSepaIdentifier(settings.creditorIban))) {
    throw billingErrors.INVALID_CREDITOR_DETAILS({ internal: { field: "iban" } });
  }
  if (
    settings.creditorId &&
    !sepa.validateCreditorID(normalizeSepaIdentifier(settings.creditorId))
  ) {
    throw billingErrors.INVALID_CREDITOR_DETAILS({
      internal: { field: "creditorId" },
    });
  }
  if (settings.creditorBic && !BIC_REGEX.test(normalizeSepaIdentifier(settings.creditorBic))) {
    throw billingErrors.INVALID_CREDITOR_DETAILS({ internal: { field: "bic" } });
  }
}

function validateCreditorDetails(sepa: SepaModule, settings: SepaSettingsRequiredCore): void {
  if (
    !sepa.validateIBAN(settings.creditorIban) ||
    !sepa.validateCreditorID(settings.creditorId) ||
    !BIC_REGEX.test(settings.creditorBic)
  ) {
    throw billingErrors.INVALID_CREDITOR_DETAILS({
      internal: {
        ibanValid: sepa.validateIBAN(settings.creditorIban),
        creditorIdValid: sepa.validateCreditorID(settings.creditorId),
        bicValid: BIC_REGEX.test(settings.creditorBic),
      },
    });
  }
}

export type SepaRenderItem = {
  invoiceId: string;
  amountCents: number;
  /** The mandate recorded on the batch item at generation time. */
  sepaMandateId: string;
  contractId: string;
  memberFirstName: string;
  memberLastName: string;
  billingPeriodStart: string;
};

export type SepaRenderMandate = {
  iban: string;
  bic: string;
  mandateReference: string;
  signatureDate: string;
};

/**
 * Build the pain.008 XML for a batch from already-loaded data. Validates the
 * creditor details first; throws if an included invoice has no active mandate.
 */
export async function renderSepaBatchXml(params: {
  batchNumber: string;
  collectionDate: string;
  settingsRow: OrganizationSettingsRow | null | undefined;
  items: SepaRenderItem[];
  mandatesById: ReadonlyMap<string, SepaRenderMandate>;
}): Promise<string> {
  const settings = requireSepaSettings(params.settingsRow);

  if (params.items.length === 0) {
    throw billingErrors.BATCH_NO_INCLUDED_INVOICES();
  }

  const sepa = await loadSepaModule();
  validateCreditorDetails(sepa, settings);

  const document = new sepa.Document("pain.008.001.08");
  document.grpHdr.id = params.batchNumber;
  document.grpHdr.created = new Date();
  document.grpHdr.initiatorName = settings.initiatorName || settings.creditorName;

  const paymentInfo = document.createPaymentInfo();
  paymentInfo.collectionDate = new Date(`${params.collectionDate}T00:00:00.000Z`);
  paymentInfo.creditorIBAN = settings.creditorIban;
  paymentInfo.creditorBIC = settings.creditorBic;
  paymentInfo.creditorName = settings.creditorName;
  paymentInfo.creditorId = settings.creditorId;
  paymentInfo.batchBooking = settings.batchBooking ?? true;

  for (const item of params.items) {
    const mandate = params.mandatesById.get(item.sepaMandateId);
    if (!mandate) {
      throw billingErrors.MISSING_MANDATE_FOR_INVOICE({
        internal: {
          invoiceId: item.invoiceId,
          contractId: item.contractId,
          sepaMandateId: item.sepaMandateId,
        },
      });
    }

    const tx = paymentInfo.createTransaction();
    tx.debtorName = `${item.memberFirstName} ${item.memberLastName}`.trim();
    tx.debtorIBAN = normalizeSepaIdentifier(mandate.iban);
    tx.debtorBIC = normalizeSepaIdentifier(mandate.bic);
    tx.mandateId = mandate.mandateReference;
    tx.mandateSignatureDate = new Date(`${mandate.signatureDate}T00:00:00.000Z`);
    tx.amount = item.amountCents / 100;
    tx.currency = "EUR";
    tx.remittanceInfo = `Invoice ${item.billingPeriodStart}`;
    tx.end2endId = `${params.batchNumber}.${item.invoiceId}`.slice(0, 35);
    paymentInfo.addTransaction(tx);
  }

  document.addPaymentInfo(paymentInfo);
  return document.toString();
}
