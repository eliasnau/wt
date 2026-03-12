import { auth } from "@repo/auth/server";
import { autumnHandler } from "autumn-js/next";

const billingActions = [
	"checkout",
	"portal",
	"billing_portal",
	"cancel",
	"attach",
];

function isBillingAction(url: string) {
	return billingActions.some((action) => url.includes(action));
}

export async function identifyAutumnOrganization(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	const customerId = session?.session.activeOrganizationId;

	if (!customerId) {
		return null;
	}

	if (isBillingAction(request.url)) {
		const { role } = await auth.api.getActiveMemberRole({
			headers: request.headers,
		});

		if (role !== "owner") {
			throw new Error("Only owners can manage billing");
		}
	}

	return {
		customerId,
	};
}

export function createAutumnOrganizationHandler() {
	return autumnHandler({
		identify: identifyAutumnOrganization,
	});
}

export { autumnHandler } from "autumn-js/next";
