"use client";

import NextTopLoader from "nextjs-toploader";
import { useSyncExternalStore } from "react";

function getColorSnapshot() {
	const primaryColor = getComputedStyle(document.documentElement)
		.getPropertyValue("--primary")
		.trim();
	return primaryColor || "#000000";
}

export function TopLoader() {
	const color = useSyncExternalStore(
		() => () => {},
		getColorSnapshot,
		() => "#000000",
	);

	return (
		<NextTopLoader
			color={color}
			height={3}
			showSpinner={false}
			shadow={`0 0 10px ${color},0 0 5px ${color}`}
			zIndex={9999}
		/>
	);
}
