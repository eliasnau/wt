"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useSearchParams } from "next/navigation";
import { SystemBanner } from "@/components/ui/system-banner";

export function DevMode() {
	const searchParams = useSearchParams();
	const devParam = searchParams.get("dev");

	const isDev = process.env.NODE_ENV === "development" || devParam === "true";

	if (!isDev) return null;

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
