"use client";

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
						clusterRadius={60}
						clusterMaxZoom={12}
						clusterColors={["#3b82f6", "#8b5cf6", "#ec4899"]}
						clusterThresholds={[50, 150]}
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
						<div className="space-y-1 p-1">
							<p className="font-semibold text-sm">
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
