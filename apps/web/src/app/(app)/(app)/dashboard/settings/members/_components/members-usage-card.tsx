"use client";

import { useCustomer } from "@repo/autumn/react";
import { Frame } from "@/components/ui/frame";
import {
	Progress,
	ProgressIndicator,
	ProgressLabel,
	ProgressTrack,
	ProgressValue,
} from "@/components/ui/progress";

function formatUsageValue(value: number | undefined) {
	return typeof value === "number" ? value : 0;
}

export function MembersUsageCard() {
	const { customer } = useCustomer();
	const usersFeature = customer?.features?.users;

	if (!usersFeature) {
		return null;
	}

	const used = formatUsageValue(usersFeature.usage);
	const included =
		typeof usersFeature.included_usage === "number"
			? usersFeature.included_usage
			: typeof usersFeature.balance === "number"
				? used + usersFeature.balance
				: undefined;

	if (typeof included !== "number") {
		return null;
	}

	return (
		<Frame className="w-full">
			<div className="p-4">
				<Progress max={included} value={used}>
					<div className="flex items-center justify-between gap-2">
						<ProgressLabel>Users</ProgressLabel>
						<ProgressValue>{() => `${used} / ${included}`}</ProgressValue>
					</div>
					<ProgressTrack>
						<ProgressIndicator />
					</ProgressTrack>
				</Progress>
			</div>
		</Frame>
	);
}
