import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../apps/web/.env",
});

/**
 * Neon hands out connection strings containing `sslrootcert=system`, meaning
 * "use the OS trust store". `pg-connection-string@2.x` (via `pg@8`) instead
 * treats the value as a *file path* and does `readFileSync("system")`, which
 * throws ENOENT — and drizzle-kit swallows it, exiting 1 with no message.
 *
 * Drop the parameter and let node's default TLS verification do the same job
 * against the system trust store. Verification stays ON; this is not
 * `rejectUnauthorized: false`.
 */
function connectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.searchParams.delete("sslrootcert");
    return url.toString();
  } catch {
    // Not a parseable URL — pass it through and let pg report the problem.
    return raw;
  }
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString(),
  },
});
