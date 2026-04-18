"use client";

import * as React from "react";

export type OperatingSystem =
	| "mac"
	| "windows"
	| "linux"
	| "ios"
	| "android"
	| "other";

type OsState = {
	os: OperatingSystem;
	isMac: boolean;
	isWindows: boolean;
	isLinux: boolean;
	isIos: boolean;
	isAndroid: boolean;
};

const DEFAULT_OS_STATE: OsState = {
	os: "other",
	isMac: false,
	isWindows: false,
	isLinux: false,
	isIos: false,
	isAndroid: false,
};

function detectOs(): OsState {
	if (typeof navigator === "undefined") {
		return DEFAULT_OS_STATE;
	}

	const nav = navigator as Navigator & {
		userAgentData?: { platform?: string };
	};

	const platform = (nav.userAgentData?.platform ?? nav.platform ?? "").toLowerCase();
	const userAgent = nav.userAgent.toLowerCase();

	const isMac = platform.includes("mac") || userAgent.includes("macintosh");
	const isWindows = platform.includes("win");
	const isLinux = platform.includes("linux");
	const isIos =
		platform.includes("ios") ||
		userAgent.includes("iphone") ||
		userAgent.includes("ipad");
	const isAndroid = platform.includes("android") || userAgent.includes("android");

	let os: OperatingSystem = "other";
	if (isMac) os = "mac";
	else if (isWindows) os = "windows";
	else if (isLinux) os = "linux";
	else if (isIos) os = "ios";
	else if (isAndroid) os = "android";

	return {
		os,
		isMac,
		isWindows,
		isLinux,
		isIos,
		isAndroid,
	};
}

export function useOs() {
	const [state, setState] = React.useState<OsState>(DEFAULT_OS_STATE);

	React.useEffect(() => {
		setState(detectOs());
	}, []);

	return state;
}
