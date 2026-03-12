import { Autumn } from "autumn-js";

let autumnClient: Autumn | null = null;

export function getAutumnClient() {
	if (!process.env.AUTUMN_SECRET_KEY) {
		return null;
	}

	if (!autumnClient) {
		autumnClient = new Autumn({
			secretKey: process.env.AUTUMN_SECRET_KEY,
		});
	}

	return autumnClient;
}

export async function syncAutumnUsage({
	customerId,
	featureId,
	value,
}: {
	customerId: string;
	featureId: string;
	value: number;
}) {
	const autumn = getAutumnClient();

	if (!autumn) {
		return;
	}

	const { error } = await autumn.usage({
		customer_id: customerId,
		feature_id: featureId,
		value,
	});

	if (error) {
		console.error("Failed to sync Autumn usage", {
			customerId,
			featureId,
			value,
			error,
		});
	}
}

export { Autumn } from "autumn-js";
export * from "autumn-js/backend";
