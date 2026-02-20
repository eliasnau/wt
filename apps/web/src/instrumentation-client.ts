import { env } from "@repo/env/web";
import posthog from "posthog-js";
import { initBotId } from "botid/client/core";

if (env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ph",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-11-30",
    advanced_disable_feature_flags: true,
  });
}
initBotId({
  protect: [
    {
      path: "/api/auth/sign-up/email",
      method: "POST",
      advancedOptions: {
        checkLevel: "deepAnalysis",
      },
    },
    {
      path: "/api/auth/sign-in/email",
      method: "POST",
      advancedOptions: {
        checkLevel: "basic",
      },
    },
  ],
});
