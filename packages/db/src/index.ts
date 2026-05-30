import { env } from "@matdesk/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();

// Re-export commonly used Drizzle operators so consumers (auth, api) don't
// each take a direct drizzle-orm dependency.
export {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  type InferInsertModel,
  type InferSelectModel,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
