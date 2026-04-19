"use client";

import { useCustomer } from "@repo/autumn/react";
import { Card, CardFrame, CardPanel } from "@/components/ui/card";
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
	const { data: customer } = useCustomer();
	const usersFeature = customer?.balances?.users;

	if (!usersFeature) {
		return null;
	}

	const used = formatUsageValue(usersFeature.usage);
	const included =
		typeof usersFeature.granted === "number"
			? usersFeature.granted
			: typeof usersFeature.remaining === "number"
				? used + usersFeature.remaining
				: undefined;

	if (typeof included !== "number") {
		return null;
	}

	return (
		<CardFrame>
			<Card>
				<CardPanel>
					<Progress max={included} value={used}>
						<div className="flex items-center justify-between gap-2">
							<ProgressLabel>Benutzer</ProgressLabel>
							<ProgressValue>{() => `${used} / ${included}`}</ProgressValue>
						</div>
						<ProgressTrack>
							<ProgressIndicator />
						</ProgressTrack>
					</Progress>
				</CardPanel>
			</Card>
		</CardFrame>
	);
}
