declare module "sepa" {
  export type SepaPaymentInfo = {
    collectionDate?: Date;
    creditorIBAN?: string;
    creditorBIC?: string;
    creditorName?: string;
    creditorId?: string;
    batchBooking?: boolean;
    addTransaction: (tx: SepaTransaction) => void;
    createTransaction: () => SepaTransaction;
  };

  export type SepaTransaction = {
    debtorName?: string;
    debtorIBAN?: string;
    debtorBIC?: string;
    mandateId?: string;
    mandateSignatureDate?: Date;
    amount?: number;
    currency?: string;
    remittanceInfo?: string;
    end2endId?: string;
  };

  export type SepaDocumentInstance = {
    grpHdr: {
      id: string;
      created: Date;
      initiatorName: string;
    };
    addPaymentInfo: (info: SepaPaymentInfo) => void;
    createPaymentInfo: () => SepaPaymentInfo;
    toString: () => string;
  };

  export type SepaStatic = {
    Document: new (format?: string) => SepaDocumentInstance;
    validateIBAN: (iban: string) => boolean;
    checksumIBAN: (iban: string) => string;
    validateCreditorID: (creditorId: string) => boolean;
    checksumCreditorID: (creditorId: string) => string;
  };

  const SEPA: SepaStatic;
  export default SEPA;
}
