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

	try {
		await autumn.track({
			customerId,
			featureId,
			value,
		});
	} catch (error) {
		console.error("Failed to sync Autumn usage", {
			customerId,
			featureId,
			value,
			error,
		});
	}
}

export async function checkAutumnFeature({
	customerId,
	featureId,
	requiredBalance = 1,
}: {
	customerId: string;
	featureId: string;
	requiredBalance?: number;
}) {
	const autumn = getAutumnClient();

	if (!autumn) {
		return { allowed: true, balance: undefined };
	}

	try {
		const data = await autumn.check({
			customerId,
			featureId,
			requiredBalance,
		});

		return {
			allowed: data.allowed,
			balance: data.balance,
		};
	} catch (error) {
		console.error("Failed to check Autumn feature access", {
			customerId,
			featureId,
			requiredBalance,
			error,
		});
		return { allowed: false, balance: undefined };
	}
}

export async function trackAutumnUsage({
	customerId,
	featureId,
	value = 1,
	idempotencyKey,
}: {
	customerId: string;
	featureId: string;
	value?: number;
	idempotencyKey?: string;
}) {
	const autumn = getAutumnClient();

	if (!autumn) {
		return;
	}

	try {
		await autumn.track({
			customerId,
			featureId,
			value,
		});
	} catch (error) {
		console.error("Failed to track Autumn usage", {
			customerId,
			featureId,
			value,
			idempotencyKey,
			error,
		});
	}
}

export { Autumn } from "autumn-js";
export * from "autumn-js/backend";
