import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });

export { and, count, eq, ilike, or, sql, inArray } from "drizzle-orm";
