import * as schema from "./schema";
import { drizzle as httpDrizzle } from 'drizzle-orm/neon-http';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, Pool } from '@neondatabase/serverless';


const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const wsDb = drizzle(pool, {schema});

const sql = neon(process.env.DATABASE_URL!,);
export const db = httpDrizzle(sql, {schema});

export {
	and,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	lte,
	or,
	sql,
	type InferSelectModel,
} from "drizzle-orm";
