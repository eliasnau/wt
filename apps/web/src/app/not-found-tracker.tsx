"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { usePathname } from "next/navigation";

export function NotFoundTracker() {
	const pathname = usePathname();

	useEffect(() => {
		posthog.capture("error:page_not_found", {
			page_path: pathname,
		});
	}, [pathname]);

	return null;
}
