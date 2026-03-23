"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
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

export function MemberMapPageClient() {
	const [viewMode, setViewMode] = useState<ViewMode>("cluster");
	const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
	const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>("carto");

	const mapQuery = useQuery(
		orpc.statistics.memberMap.queryOptions({ input: {} }),
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

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Mitgliederkarte</HeaderTitle>
					<HeaderDescription>
						Geografische Verteilung aktiver Mitglieder nach Wohnort mit Cluster-
						und Heatmap-Ansicht.
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<MemberMapToolbar
				groupOptions={groupOptions}
				selectedGroups={selectedGroups}
				onSelectedGroupsChange={setSelectedGroups}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
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
					<div className="grid gap-6 lg:grid-cols-4">
						<Frame>
							<FrameHeader className="flex-row items-start justify-between">
								<div>
									<p className="text-muted-foreground text-xs uppercase">
										Mitglieder gesamt
									</p>
									<p className="font-semibold text-2xl">
										{mapQuery.isPending ? "-" : filteredMembers.length}
									</p>
									<p className="text-muted-foreground text-xs">
										Verteilt auf{" "}
										{mapQuery.isPending ? "-" : citySummaries.length} Orte
									</p>
								</div>
							</FrameHeader>
						</Frame>
						<Frame>
							<FrameHeader className="flex-row items-start justify-between">
								<div>
									<p className="text-muted-foreground text-xs uppercase">
										Größter Standort
									</p>
									<p className="font-semibold text-2xl">
										{mapQuery.isPending ? "-" : (largestCity?.city ?? "-")}
									</p>
									<p className="text-muted-foreground text-xs">
										{mapQuery.isPending
											? "-"
											: `${largestCity?.count ?? 0} Mitglieder`}
									</p>
								</div>
							</FrameHeader>
						</Frame>
						<Frame>
							<FrameHeader className="flex-row items-start justify-between">
								<div>
									<p className="text-muted-foreground text-xs uppercase">
										Durchschnitt
									</p>
									<p className="font-semibold text-2xl">
										{mapQuery.isPending ? "-" : averagePerCity}
									</p>
									<p className="text-muted-foreground text-xs">
										Mitglieder pro Ort
									</p>
								</div>
							</FrameHeader>
						</Frame>
						<Frame>
							<FrameHeader className="flex-row items-start justify-between">
								<div>
									<p className="text-muted-foreground text-xs uppercase">
										Datenstand
									</p>
									<p className="font-semibold text-2xl">
										{mapQuery.isPending ? "-" : "Live"}
									</p>
									<p className="text-muted-foreground text-xs">
										Aktive Verträge der Organisation
									</p>
								</div>
							</FrameHeader>
						</Frame>
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
