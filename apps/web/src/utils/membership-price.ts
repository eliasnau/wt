const membershipPricePattern = /^\d+(\.\d{1,2})?$/;

export function normalizeMembershipPriceInput(value: string) {
	return value.trim().replace(/\s+/g, "").replace(",", ".");
}

export function parseMembershipPriceInput(value: string) {
	const normalizedValue = normalizeMembershipPriceInput(value);
	if (normalizedValue === "") return null;
	if (!membershipPricePattern.test(normalizedValue)) return null;

	const parsedValue = Number(normalizedValue);
	if (!Number.isFinite(parsedValue) || parsedValue < 0) return null;

	return parsedValue;
}

export function isMembershipPriceInputValid(value: string) {
	return value.trim() === "" || parseMembershipPriceInput(value) !== null;
}

export function isFreeMembershipPrice(
	value: number | string | null | undefined,
) {
	if (value === null || value === undefined) return false;

	const parsedValue =
		typeof value === "number" ? value : Number.parseFloat(value);

	return Number.isFinite(parsedValue) && parsedValue === 0;
}
