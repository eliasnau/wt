declare module "sepa" {
	type SepaDocument = new (format?: string) => any;
	type SepaPaymentInfo = new () => any;
	type SepaTransaction = new () => any;

	const SEPA: {
		Document: SepaDocument;
		PaymentInfo: SepaPaymentInfo;
		Transaction: SepaTransaction;
		validateIBAN: (iban: string) => boolean;
		checksumIBAN: (iban: string) => string;
		validateCreditorID: (creditorId: string) => boolean;
		checksumCreditorID: (creditorId: string) => string;
	};

	export default SEPA;
	export = SEPA;
}
