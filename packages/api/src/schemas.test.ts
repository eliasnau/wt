import { describe, expect, it } from "vitest";

import { databaseIdSchema } from "./schemas";

describe("databaseIdSchema", () => {
  it("accepts legacy UUID-shaped database IDs", () => {
    expect(databaseIdSchema.safeParse("d478fa82-c551-049c-f559-40f8432185a8").success).toBe(true);
  });

  it("rejects malformed IDs", () => {
    expect(databaseIdSchema.safeParse("not-an-id").success).toBe(false);
  });
});
