import { Axiom } from '@axiomhq/js';
import { Logger, AxiomJSTransport } from '@axiomhq/logging';
import { nextJsFormatters } from '@axiomhq/nextjs';

const axiomClient = new Axiom({
	token: process.env.AXIOM_TOKEN!,
});

export const logger = new Logger({
	transports: [
		new AxiomJSTransport({ 
			axiom: axiomClient, 
			dataset: process.env.AXIOM_DATASET! 
		}),
	],
	formatters: nextJsFormatters,
});
