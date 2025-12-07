"use client";

import { useEffect, useState } from "react";
import NextTopLoader from "nextjs-toploader";

export function TopLoader() {
	const [color, setColor] = useState("#000000");

	useEffect(() => {
		const root = document.documentElement;
		const computedStyle = getComputedStyle(root);
		const primaryColor = computedStyle.getPropertyValue("--primary").trim();

		if (primaryColor) {
			setColor(primaryColor);
		}
	}, []);

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
