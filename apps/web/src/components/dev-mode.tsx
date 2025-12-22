"use client";

import { Suspense } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SystemBanner } from "@/components/ui/system-banner";
import { useQueryState } from "nuqs";

function DevModeContent() {
	const [devParam] = useQueryState("dev");
	const showDev =
		devParam === "true" ||
		process.env.NODE_ENV === "development";

	if (!showDev) return null;
	
	return (
		<>
			<ReactQueryDevtools initialIsOpen={false} />
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
