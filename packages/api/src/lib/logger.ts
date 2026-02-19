import { Axiom } from "@axiomhq/js";
import { AxiomJSTransport, Logger } from "@axiomhq/logging";
import { nextJsFormatters } from "@axiomhq/nextjs";
import { env } from "@repo/env/web";

const axiomClient = new Axiom({
	token: env.AXIOM_TOKEN!,
});

export const logger = new Logger({
	transports: [
		new AxiomJSTransport({
			axiom: axiomClient,
			dataset: env.AXIOM_DATASET!,
		}),
	],
	formatters: nextJsFormatters,
});
