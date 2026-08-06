/** Where users land after authenticating when no destination was carried over. */
export const DEFAULT_REDIRECT_URL = "/organizations";

/**
 * `redirectUrl` is attacker-controllable (it comes straight off the query
 * string), so only same-origin absolute paths are honoured. Anything else —
 * protocol-relative `//evil.com`, a full URL, a bare word — falls back to the
 * default so we can never be used as an open redirect.
 */
export function safeRedirectUrl(value: string | undefined): string {
  if (!value) return DEFAULT_REDIRECT_URL;
  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_URL;
  }
  return value;
}
