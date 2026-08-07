import { env } from "@matdesk/env/server";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// PlanetScale Postgres exposes the Neon-compatible HTTP protocol at /sql.
// HTTP is the default transport so ordinary serverless requests don't hold a
// database connection open between queries.
neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;

export const db = drizzleHttp({
  client: neon(env.DATABASE_URL),
  schema,
});

function nodePostgresConnectionString(): string {
  try {
    const url = new URL(env.DATABASE_URL);
    // pg-connection-string treats `system` as a certificate file path.
    url.searchParams.delete("sslrootcert");
    return url.toString();
  } catch {
    return env.DATABASE_URL;
  }
}

// The pool is lazy: it opens a connection only when an interactive transaction
// starts. One connection per serverless instance prevents connection storms.
const transactionPool = new Pool({
  connectionString: nodePostgresConnectionString(),
  max: 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
});

export const transactionDb = drizzlePg(transactionPool, { schema });

// Re-export commonly used Drizzle operators so consumers (auth, api) don't
// each take a direct drizzle-orm dependency.
export {
  and,
  type AnyColumn,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  type InferInsertModel,
  type InferSelectModel,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
