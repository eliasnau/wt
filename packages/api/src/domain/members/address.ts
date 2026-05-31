/**
 * Pure address helpers — no I/O. The geocoding *call* lives in
 * `integrations/geocoding.ts`; deciding *whether* to re-geocode is pure logic
 * and tested here.
 */

export type GeocodableAddress = {
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

/**
 * True when two addresses would produce a different geocoding query. `state` is
 * intentionally excluded — the Nominatim lookup keys on street/postcode/city/
 * country, so a state-only change shouldn't trigger a network round-trip.
 */
export function addressAffectsGeocode(
  a: GeocodableAddress,
  b: GeocodableAddress,
): boolean {
  return (
    a.street.trim() !== b.street.trim() ||
    a.postalCode.trim() !== b.postalCode.trim() ||
    a.city.trim() !== b.city.trim() ||
    a.country.trim() !== b.country.trim()
  );
}
