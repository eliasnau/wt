"use client";

import * as React from "react";

export type SidebarStyle = "legacy" | "experimental";

type SidebarStyleContextValue = {
	isReady: boolean;
	setStyle: React.Dispatch<React.SetStateAction<SidebarStyle>>;
	style: SidebarStyle;
};

// Bumped to v2 so the previously auto-persisted "legacy" value doesn't pin
// existing browsers now that experimental is the default.
const STORAGE_KEY = "app-sidebar-style-v2";

const SidebarStyleContext =
	React.createContext<SidebarStyleContextValue | null>(null);

export function SidebarStyleProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [style, setStyle] = React.useState<SidebarStyle>("experimental");
	const [isReady, setIsReady] = React.useState(false);

	React.useEffect(() => {
		const storedStyle = window.localStorage.getItem(STORAGE_KEY);
		if (storedStyle === "legacy" || storedStyle === "experimental") {
			setStyle(storedStyle);
		}
		setIsReady(true);
	}, []);

	React.useEffect(() => {
		if (!isReady) {
			return;
		}
		window.localStorage.setItem(STORAGE_KEY, style);
	}, [isReady, style]);

	const value = React.useMemo(
		() => ({
			isReady,
			setStyle,
			style,
		}),
		[isReady, style],
	);

	return (
		<SidebarStyleContext.Provider value={value}>
			{children}
		</SidebarStyleContext.Provider>
	);
}

export function useSidebarStyle() {
	const context = React.useContext(SidebarStyleContext);

	if (!context) {
		throw new Error(
			"useSidebarStyle must be used within a SidebarStyleProvider.",
		);
	}

	return context;
}
