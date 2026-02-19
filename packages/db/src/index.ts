import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as httpDrizzle } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const wsDb = drizzle(pool, { schema });

const sql = neon(process.env.DATABASE_URL!);
export const db = httpDrizzle(sql, { schema });

export {
	and,
	count,
	desc,
	eq,
	type InferSelectModel,
	ilike,
	inArray,
	isNull,
	lte,
	or,
	sql,
} from "drizzle-orm";
