import * as React from "react";

/**
 * Custom hook to detect media query matches
 * @param query - CSS media query string (e.g., "max-md", "(max-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
	// Convert shorthand queries to full media query strings
	const getMediaQuery = (q: string) => {
		if (q.startsWith("max-") || q.startsWith("min-")) {
			const [type, breakpoint] = q.split("-");
			const breakpoints: Record<string, string> = {
				sm: "640px",
				md: "768px",
				lg: "1024px",
				xl: "1280px",
				"2xl": "1536px",
			};
			const size = breakpoints[breakpoint];
			return size ? `(${type}-width: ${size})` : q;
		}
		return q.startsWith("(") ? q : `(${q})`;
	};

	const mediaQuery = getMediaQuery(query);
	const [matches, setMatches] = React.useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia(mediaQuery).matches;
	});

	React.useEffect(() => {
		const mediaQueryList = window.matchMedia(mediaQuery);
		const onChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		// Modern browsers
		mediaQueryList.addEventListener("change", onChange);
		// Update initial state
		setMatches(mediaQueryList.matches);

		return () => {
			mediaQueryList.removeEventListener("change", onChange);
		};
	}, [mediaQuery]);

	return matches;
}
