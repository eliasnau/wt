import { env } from "@matdesk/env/server";

/**
 * Address → coordinates via a Nominatim-compatible `/search` endpoint.
 *
 * Defaults to public OpenStreetMap Nominatim; point `GEOCODING_BASE_URL` at a
 * self-hosted instance or a Nominatim-compatible provider (e.g. LocationIQ,
 * which also wants `GEOCODING_API_KEY`) for production volume / EU hosting.
 *
 * **Fails soft** — any network error, timeout, non-OK response, or empty result
 * returns `null`. Geocoding must never block member create/update; a member
 * with null coordinates simply doesn't plot on the map until re-geocoded.
 */

export type GeocodeResult = {
  latitude: number;
  longitude: number;
};

export type GeocodeAddressInput = {
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_USER_AGENT = "matdesk/1.0 (+https://matdesk.app)";
const TIMEOUT_MS = 8000;

export async function geocodeAddress(
  input: GeocodeAddressInput,
): Promise<GeocodeResult | null> {
  const street = input.street.trim();
  const postalCode = input.postalCode.trim();
  const city = input.city.trim();
  const country = input.country.trim();

  if (!street || !postalCode || !city || !country) {
    return null;
  }

  const url = new URL(env.GEOCODING_BASE_URL ?? DEFAULT_BASE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("street", street);
  url.searchParams.set("postalcode", postalCode);
  url.searchParams.set("city", city);
  url.searchParams.set("country", country);
  if (env.GEOCODING_API_KEY) {
    url.searchParams.set("key", env.GEOCODING_API_KEY);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": env.GEOCODING_USER_AGENT ?? DEFAULT_USER_AGENT,
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
