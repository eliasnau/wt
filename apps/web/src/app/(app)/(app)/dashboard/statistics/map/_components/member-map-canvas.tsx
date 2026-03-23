"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
	MapClusterLayer,
	MapControls,
	MapHeatmapLayer,
	MapPopup,
	Map as UiMap,
} from "@/components/ui/map";
import {
	buildMemberFeatureCollection,
	type MemberFeatureProperties,
	type MemberMapRecord,
	SCHOOL_CENTER,
} from "./member-map-data";
import type { ViewMode } from "./member-map-toolbar";

type MapStyleOption = {
	label: string;
	light: string;
	dark: string;
};

type MemberMapCanvasProps = {
	members: MemberMapRecord[];
	viewMode: ViewMode;
	mapStyle: MapStyleOption;
};

export function MemberMapCanvas({
	members,
	viewMode,
	mapStyle,
}: MemberMapCanvasProps) {
	const [selectedMember, setSelectedMember] = useState<{
		coordinates: [number, number];
		properties: MemberFeatureProperties;
	} | null>(null);

	const featureCollection = useMemo(
		() => buildMemberFeatureCollection(members),
		[members],
	);

	return (
		<div className="h-[600px] w-full overflow-hidden rounded-lg">
			<UiMap
				center={SCHOOL_CENTER}
				zoom={10}
				fadeDuration={0}
				styles={{ light: mapStyle.light, dark: mapStyle.dark }}
			>
				{viewMode === "cluster" ? (
					<MapClusterLayer<MemberFeatureProperties>
						data={featureCollection}
						clusterRadius={50}
						clusterMaxZoom={14}
						clusterColors={["#3b82f6", "#8b5cf6", "#ec4899"]}
						pointColor="#3b82f6"
						onPointClick={(feature, coordinates) => {
							setSelectedMember({
								coordinates,
								properties: feature.properties,
							});
						}}
					/>
				) : (
					<MapHeatmapLayer<MemberFeatureProperties>
						data={featureCollection}
						maxZoom={14}
						pointMinZoom={12}
						radius={25}
						intensity={0.6}
						opacity={0.85}
						pointColor="#ef4444"
						onPointClick={(feature, coordinates) => {
							setSelectedMember({
								coordinates,
								properties: feature.properties,
							});
						}}
					/>
				)}

				{selectedMember && (
					<MapPopup
						key={`${selectedMember.coordinates[0]}-${selectedMember.coordinates[1]}`}
						longitude={selectedMember.coordinates[0]}
						latitude={selectedMember.coordinates[1]}
						onClose={() => setSelectedMember(null)}
						closeOnClick={false}
						focusAfterOpen={false}
						closeButton
					>
						<div className="space-y-2 p-1">
							<Link
								href={`/dashboard/members/${selectedMember.properties.memberId}`}
								target="_blank"
								rel="noreferrer"
								className="group inline-flex items-center gap-1 font-semibold text-sm hover:underline hover:underline-offset-4"
							>
								<span>
									{selectedMember.properties.firstName}{" "}
									{selectedMember.properties.lastName}
								</span>
								<ExternalLinkIcon className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
							</Link>
							<p className="text-muted-foreground text-xs">
								{selectedMember.properties.city}
							</p>
							<p className="text-muted-foreground text-xs">
								PLZ {selectedMember.properties.postalCode}
							</p>
						</div>
					</MapPopup>
				)}

				<MapControls
					position="bottom-right"
					showZoom
					showCompass
					showLocate
					showFullscreen
				/>
			</UiMap>
		</div>
	);
}
