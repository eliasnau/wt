import evlog from "evlog/nitro/v3";
import { defineConfig } from "nitro";

export default defineConfig({
  experimental: {
    asyncContext: true,
  },
  modules: [
    evlog({
      env: { service: "matdesk-web" },
      // RPC routes get their own wide event via `withEvlog()` in
      // src/routes/api/rpc/$.ts. Exclude them here so each RPC call
      // emits exactly one event instead of two.
      exclude: ["/api/rpc/**"],
    }),
  ],
});
