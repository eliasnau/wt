type GeocodeResult = {
	latitude: number;
	longitude: number;
};

type GeocodeAddressInput = {
	street: string;
	postalCode: string;
	city: string;
	country: string;
};

function normalizeAddressPart(value: string) {
	return value.trim();
}

export async function geocodeAddress(
	input: GeocodeAddressInput,
): Promise<GeocodeResult | null> {
	const street = normalizeAddressPart(input.street);
	const postalCode = normalizeAddressPart(input.postalCode);
	const city = normalizeAddressPart(input.city);
	const country = normalizeAddressPart(input.country);

	if (!street || !postalCode || !city || !country) {
		return null;
	}

	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("limit", "1");
	url.searchParams.set("addressdetails", "0");
	url.searchParams.set("street", street);
	url.searchParams.set("postalcode", postalCode);
	url.searchParams.set("city", city);
	url.searchParams.set("country", country);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "wt-members-map/1.0",
				"Accept-Language": "de,en;q=0.8",
			},
			signal: controller.signal,
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const results = (await response.json()) as Array<{
			lat?: string;
			lon?: string;
		}>;

		const first = results[0];
		if (!first?.lat || !first.lon) {
			return null;
		}

		const latitude = Number(first.lat);
		const longitude = Number(first.lon);

		if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
			return null;
		}

		return { latitude, longitude };
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
