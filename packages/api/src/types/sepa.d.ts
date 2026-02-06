declare module "sepa" {
	type SepaPaymentInfo = {
		collectionDate?: Date;
		creditorIBAN?: string;
		creditorBIC?: string;
		creditorName?: string;
		creditorId?: string;
		batchBooking?: boolean;
		addTransaction: (tx: SepaTransaction) => void;
		createTransaction: () => SepaTransaction;
	};

	type SepaTransaction = {
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

	type SepaDocument = new (format?: string) => {
		grpHdr: {
			id: string;
			created: Date;
			initiatorName: string;
		};
		addPaymentInfo: (info: SepaPaymentInfo) => void;
		createPaymentInfo: () => SepaPaymentInfo;
		toString: () => string;
	};

	const SEPA: {
		Document: SepaDocument;
		validateIBAN: (iban: string) => boolean;
		checksumIBAN: (iban: string) => string;
		validateCreditorID: (creditorId: string) => boolean;
		checksumCreditorID: (creditorId: string) => string;
	};

	export default SEPA;
	export = SEPA;
}
