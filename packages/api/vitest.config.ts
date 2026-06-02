import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // pglite (in-process WASM Postgres) is slow to spin up + exec the schema in
    // beforeEach; generous timeouts keep the integration suite deterministic
    // under parallel load. Pure unit tests finish in milliseconds regardless.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Integration tests import the query layer, which transitively constructs
    // the (lazy, never-connected) node-postgres pool and validates server env.
    // These dummy values satisfy validation; the real DB is pglite (in-process).
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
      CORS_ORIGIN: "http://localhost:3000",
      NODE_ENV: "test",
    },
  },
});
