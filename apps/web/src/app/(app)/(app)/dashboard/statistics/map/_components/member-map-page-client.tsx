"use client";

import { useQuery } from "@tanstack/react-query";
import {
	AlertCircleIcon,
	Building2Icon,
	MapPinnedIcon,
	RouteIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/ui/decor-icon";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../../_components/page-header";
import { MemberMapCanvas } from "./member-map-canvas";
import {
	filterMembersByGroups,
	getCitySummaries,
	type MemberMapRecord,
} from "./member-map-data";
import { MemberMapToolbar, type ViewMode } from "./member-map-toolbar";

const mapStyles = {
	carto: {
		label: "Carto",
		light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
		dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
	},
	liberty: {
		label: "Liberty",
		light: "https://tiles.openfreemap.org/styles/liberty",
		dark: "https://tiles.openfreemap.org/styles/liberty",
	},
	bright: {
		label: "Bright",
		light: "https://tiles.openfreemap.org/styles/bright",
		dark: "https://tiles.openfreemap.org/styles/bright",
	},
} as const;

type MapStyleKey = keyof typeof mapStyles;
type MapStatFeature = {
	title: string;
	icon: React.ReactNode;
	value: string | number;
	description: string;
};

function MapStatFeatureCard({
	feature,
	className,
	...props
}: React.ComponentProps<"div"> & {
	feature: MapStatFeature;
}) {
	return (
		<div
			className={cn(
				"relative flex min-h-0 flex-col justify-between gap-3 bg-background px-5 pt-5 pb-4 shadow-xs",
				"dark:bg-[radial-gradient(50%_80%_at_25%_0%,--theme(--color-foreground/.1),transparent)]",
				className,
			)}
			{...props}
		>
			<DecorIcon className="size-3.5" position="top-left" />

			<div className="absolute -inset-y-4 -left-px w-px bg-border" />
			<div className="absolute -inset-y-4 -right-px w-px bg-border" />
			<div className="absolute -inset-x-4 -top-px h-px bg-border" />
			<div className="absolute -right-4 -bottom-px -left-4 h-px bg-border" />

			<div
				className={cn(
					"relative z-10 flex w-fit items-center justify-center rounded-lg border bg-muted/20 p-2.5",
					"[&_svg]:size-4.5 [&_svg]:stroke-[1.5] [&_svg]:text-foreground",
				)}
			>
				{feature.icon}
			</div>

			<div className="relative z-10 space-y-1.5">
				<p className="font-medium text-sm text-foreground">{feature.title}</p>
				<p className="font-semibold text-xl">{feature.value}</p>
				<p className="text-muted-foreground text-xs leading-relaxed">
					{feature.description}
				</p>
			</div>
		</div>
	);
}

export function MemberMapPageClient() {
	const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
	const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
	const [includeActive, setIncludeActive] = useState(true);
	const [includeCancelled, setIncludeCancelled] = useState(false);
	const [includeCancelledButActive, setIncludeCancelledButActive] =
		useState(true);
	const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>("carto");

	const mapQuery = useQuery(
		orpc.statistics.memberMap.queryOptions({
			input: {
				includeActive,
				includeCancelled,
				includeCancelledButActive,
			},
		}),
	);
	const groupsQuery = useQuery(orpc.groups.list.queryOptions({ input: {} }));

	const groupOptions = useMemo(
		() =>
			(groupsQuery.data ?? []).map((group) => ({
				label: group.name,
				value: group.id,
			})),
		[groupsQuery.data],
	);

	const members = (mapQuery.data?.members ?? []) as MemberMapRecord[];
	const filteredMembers = useMemo(
		() => filterMembersByGroups(members, selectedGroups),
		[members, selectedGroups],
	);
	const citySummaries = useMemo(
		() => getCitySummaries(filteredMembers),
		[filteredMembers],
	);
	const largestCity = citySummaries[0] ?? null;
	const averagePerCity =
		citySummaries.length > 0
			? Math.round(filteredMembers.length / citySummaries.length)
			: 0;
	const statFeatures: MapStatFeature[] = [
		{
			title: "Mitglieder gesamt",
			icon: <UsersIcon />,
			value: mapQuery.isPending ? "-" : filteredMembers.length,
			description: `Verteilt auf ${
				mapQuery.isPending ? "-" : citySummaries.length
			} Orte`,
		},
		{
			title: "Größter Standort",
			icon: <Building2Icon />,
			value: mapQuery.isPending ? "-" : (largestCity?.city ?? "-"),
			description: mapQuery.isPending
				? "-"
				: `${largestCity?.count ?? 0} Mitglieder`,
		},
		{
			title: "Durchschnitt",
			icon: <MapPinnedIcon />,
			value: mapQuery.isPending ? "-" : averagePerCity,
			description: "Mitglieder pro Ort",
		},
		{
			title: "Durchschnitt",
			icon: <RouteIcon />,
			value: mapQuery.isPending ? "-" : "0 km",
			description: "Entfernung zur Schule",
		},
	];

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Mitgliederkarte</HeaderTitle>
					<HeaderDescription>
						Geografische Verteilung der Mitglieder nach Wohnort mit Cluster- und
						Heatmap-Ansicht.
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<MemberMapToolbar
				groupOptions={groupOptions}
				selectedGroups={selectedGroups}
				onSelectedGroupsChange={setSelectedGroups}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
				includeActive={includeActive}
				includeCancelled={includeCancelled}
				includeCancelledButActive={includeCancelledButActive}
				onIncludeActiveChange={setIncludeActive}
				onIncludeCancelledChange={setIncludeCancelled}
				onIncludeCancelledButActiveChange={setIncludeCancelledButActive}
				mapStyleKey={mapStyleKey}
				mapStyles={mapStyles}
				onMapStyleChange={(value) => setMapStyleKey(value as MapStyleKey)}
			/>

			{mapQuery.error ? (
				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircleIcon />
								</EmptyMedia>
								<EmptyTitle>
									Mitgliederkarte konnte nicht geladen werden
								</EmptyTitle>
								<EmptyDescription>
									{mapQuery.error instanceof Error
										? mapQuery.error.message
										: "Bitte versuche es erneut."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => mapQuery.refetch()}>
									Erneut versuchen
								</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						{statFeatures.map((feature) => (
							<MapStatFeatureCard
								feature={feature}
								key={`${feature.title}-${feature.description}`}
							/>
						))}
					</div>

					<Frame>
						<FramePanel className="p-0">
							<MemberMapCanvas
								members={filteredMembers}
								viewMode={viewMode}
								mapStyle={mapStyles[mapStyleKey]}
							/>
						</FramePanel>
					</Frame>
				</>
			)}
		</div>
	);
}
