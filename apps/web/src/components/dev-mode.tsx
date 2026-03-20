"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useQueryState } from "nuqs";
import { Suspense } from "react";
import { SystemBanner } from "@/components/ui/system-banner";
// import { TanStackDevtools } from "@tanstack/react-devtools";
// import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools";

function DevModeContent() {
  const [devParam] = useQueryState("dev");
  const showDev = devParam === "true" || process.env.NODE_ENV === "development";

  if (!showDev) return null;

  return (
    <>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
      {/*<TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />*/}
      <SystemBanner
        text="Development Mode"
        color="bg-orange-500"
        size="sm"
        show={true}
      />
    </>
  );
}

export function DevMode() {
  return (
    <Suspense fallback={null}>
      <DevModeContent />
    </Suspense>
  );
}
