"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useQueryState } from "nuqs";
import { Suspense, useEffect } from "react";
import { SystemBanner } from "@/components/ui/system-banner";

// import { scan } from "react-scan/all-environments";

function DevModeContent() {
	const [devParam] = useQueryState("dev");
	const showDev = devParam === "true" || process.env.NODE_ENV === "development";

	// useEffect(() => {
	//   scan({
	//     enabled: showDev,
	//     animationSpeed: "off",
	//   });
	// }, [showDev]);

	if (!showDev) return null;

	return (
		<>
			<ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
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
