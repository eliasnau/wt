"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect } from "react";

export function NotFoundTracker() {
	const pathname = usePathname();

	useEffect(() => {
		posthog.capture("error:page_not_found", {
			page_path: pathname,
		});
	}, [pathname]);

	return null;
}
