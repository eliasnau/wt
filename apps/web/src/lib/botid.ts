import type { initBotId } from "botid/client/core";

export const botIdConfig: Parameters<typeof initBotId>[0] = {
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
};
