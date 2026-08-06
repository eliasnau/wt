import { describe, expect, it } from "vitest";

import { addressAffectsGeocode } from "./address";

const base = {
  street: "Hauptstraße 1",
  postalCode: "10115",
  city: "Berlin",
  country: "Deutschland",
};

describe("addressAffectsGeocode", () => {
  it("is false when the geocoding-relevant fields are unchanged", () => {
    expect(addressAffectsGeocode(base, { ...base })).toBe(false);
  });

  it("ignores leading/trailing whitespace differences", () => {
    expect(addressAffectsGeocode(base, { ...base, city: "  Berlin  " })).toBe(
      false,
    );
  });

  it("is true when any of street/postcode/city/country changes", () => {
    expect(addressAffectsGeocode(base, { ...base, street: "Hauptstraße 2" })).toBe(true);
    expect(addressAffectsGeocode(base, { ...base, postalCode: "10117" })).toBe(true);
    expect(addressAffectsGeocode(base, { ...base, city: "Potsdam" })).toBe(true);
    expect(addressAffectsGeocode(base, { ...base, country: "Österreich" })).toBe(true);
  });
});
