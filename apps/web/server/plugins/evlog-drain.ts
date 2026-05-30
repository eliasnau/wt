import { env } from "@matdesk/env/server";
import { createAxiomDrain } from "evlog/axiom";
import { definePlugin } from "nitro";

// Registers Axiom as the drain for the framework-level evlog module
// (`evlog/nitro/v3` in `nitro.config.ts`). When `AXIOM_API_KEY` / `AXIOM_DATASET`
// are unset, this no-ops and the module falls back to its default drain — fine
// for local dev. The oRPC handler's drain is wired separately in
// `src/routes/api/rpc/$.ts`.
//
// Importing `env` (rather than reading `process.env` directly) ensures
// `dotenv/config` has run before we check — otherwise the plugin can fire
// before any other module loads the env package, and the check no-ops.
export default definePlugin((nitroApp) => {
  if (!env.AXIOM_API_KEY || !env.AXIOM_DATASET) return;
  nitroApp.hooks.hook("evlog:drain", createAxiomDrain());
});
