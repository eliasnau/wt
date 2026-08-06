import { env } from "@matdesk/env/server";

/**
 * Address → coordinates via a Nominatim-compatible `/search` endpoint.
 *
 * Configured provider is LocationIQ (`GEOCODING_BASE_URL` +
 * `GEOCODING_API_KEY`); it defaults to public OpenStreetMap Nominatim, so a
 * self-hosted Nominatim works too.
 *
 * **Runs on the request path**, inline in the member create/update procedures
 * (there is no job queue — see `REWRITE_TODO.md`). Because a member write must
 * never fail on a flaky third party, the error contract is *fail soft*:
 *
 *   • **Every** failure — missing address fields, network error, timeout,
 *     non-2xx, unparseable body, empty/invalid result — returns `null`.
 *     `geocodeAddress` never throws.
 *   • The reason lands on the request's wide event as
 *     `data.geocoding.{ ok, reason }` when a logger is threaded in, so soft
 *     failures stay visible instead of silently producing pin-less members.
 *
 * A member without coordinates is a normal state: they simply don't plot on the
 * map until the address is edited (or a back-fill runs).
 *
 * The query is sent as a single free-form `q=` string with `format=json` — the
 * common denominator across Nominatim and LocationIQ. (LocationIQ's `/v1/search`
 * doesn't accept `jsonv2` or the structured street/city/postcode params; those
 * live on its separate `/v1/search/structured` endpoint.)
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

/** Minimal logger shape so this module doesn't depend on evlog's `RequestLogger`
 *  type (web and api resolve separate evlog instances). Procedures pass
 *  `context.log`; `undefined` is fine and simply skips the annotation. */
export type GeocodeLogger = {
  set: (fields: { data: Record<string, unknown> }) => void;
};

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_USER_AGENT = "matdesk/1.0 (+https://matdesk.app)";
/** On the request path a user is waiting for this — 3s, then give up. */
const TIMEOUT_MS = 3000;

export async function geocodeAddress(
  input: GeocodeAddressInput,
  log?: GeocodeLogger,
): Promise<GeocodeResult | null> {
  const fail = (reason: string, detail?: Record<string, unknown>): null => {
    log?.set({ data: { geocoding: { ok: false, reason, ...detail } } });
    return null;
  };

  const street = input.street.trim();
  const postalCode = input.postalCode.trim();
  const city = input.city.trim();
  const country = input.country.trim();

  if (!street || !postalCode || !city || !country) {
    return fail("incomplete_address");
  }

  const url = new URL(env.GEOCODING_BASE_URL ?? DEFAULT_BASE_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  // Free-form query: "<street>, <postcode> <city>, <country>". Works on both
  // Nominatim and LocationIQ's `/v1/search` (which doesn't take structured params).
  url.searchParams.set("q", `${street}, ${postalCode} ${city}, ${country}`);
  if (env.GEOCODING_API_KEY) {
    url.searchParams.set("key", env.GEOCODING_API_KEY);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": env.GEOCODING_USER_AGENT ?? DEFAULT_USER_AGENT,
        "Accept-Language": "de,en;q=0.8",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    // Rate limit, provider outage, auth hiccup — transient, but there's nobody
    // to retry for us, so treat it like any other miss.
    if (!response.ok) {
      return fail("http_error", { status: response.status });
    }

    const results = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;

    const first = Array.isArray(results) ? results[0] : undefined;
    if (!first?.lat || !first.lon) {
      return fail("no_match");
    }

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return fail("invalid_coordinates");
    }

    log?.set({ data: { geocoding: { ok: true } } });
    return { latitude, longitude };
  } catch (error) {
    // Network error, abort/timeout, or an unparseable JSON body.
    return timedOut
      ? fail("timeout", { timeoutMs: TIMEOUT_MS })
      : fail("request_failed", { error: String(error) });
  } finally {
    clearTimeout(timeout);
  }
}
