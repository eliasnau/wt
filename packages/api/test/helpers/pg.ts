import { readFileSync } from "node:fs";

import * as schema from "@matdesk/db/schema";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const SCHEMA_SQL = readFileSync(new URL("../fixtures/schema.sql", import.meta.url), "utf8");

/**
 * An in-process Postgres (pglite) with the full schema applied. The returned
 * `db` is cast to the production `db` type so the real query/engine functions —
 * typed against node-postgres — run against it unchanged. Drizzle's query
 * builder is driver-agnostic, so this is a safe structural substitution.
 */
type ProdDb = typeof import("@matdesk/db").db;

export async function createTestDb(): Promise<{ client: PGlite; db: ProdDb }> {
  const client = new PGlite();
  await client.exec(SCHEMA_SQL);
  const db = drizzle(client, { schema }) as unknown as ProdDb;
  return { client, db };
}

export type TestDb = ProdDb;
