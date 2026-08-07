"use client";

import { Button } from "@matdesk/ui/components/button";
import {
	Menu,
	MenuCheckboxItem,
	MenuGroup,
	MenuGroupLabel,
	MenuPopup,
	MenuTrigger,
} from "@matdesk/ui/components/menu";
import { Tabs, TabsList, TabsTab } from "@matdesk/ui/components/tabs";
import {
	Map,
	MapClusterLayer,
	MapControls,
	MapPopup,
	useMap,
} from "@matdesk/ui/components/ui/map";
import { useQuery } from "@tanstack/react-query";
import { parseError } from "evlog";
import { FlameIcon, GridIcon, ListFilterIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { groupsQueryOptions } from "@/queries/groups";
import { statisticsMemberMapQueryOptions } from "@/queries/statistics";

type ViewMode = "cluster" | "heatmap";

type MemberProps = {
	memberId: string;
	name: string;
	city: string;
	postalCode: string;
};

const FALLBACK_CENTER: [number, number] = [11.576, 48.137];

const HEATMAP_COLORS = ["#fff7bc", "#fee391", "#fec44f", "#fe9929", "#d7301f"];
const HEATMAP_STOPS: Array<number | string> = [
	0.15, HEATMAP_COLORS[0], 0.35, HEATMAP_COLORS[1], 0.55, HEATMAP_COLORS[2],
	0.75, HEATMAP_COLORS[3], 1, HEATMAP_COLORS[4],
];

type PointClickEvent = {
	features?: Array<GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>>;
};

function MemberHeatmapLayer({
	data,
	onPointClick,
}: {
	data: GeoJSON.FeatureCollection<GeoJSON.Point, MemberProps>;
	onPointClick?: (properties: MemberProps, coordinates: [number, number]) => void;
}) {
	const { map, isLoaded } = useMap();
	const id = useId();
	const sourceId = `member-heat-src-${id}`;
	const heatLayerId = `member-heat-${id}`;
	const pointLayerId = `member-heat-point-${id}`;
	const onPointClickRef = useRef(onPointClick);
	onPointClickRef.current = onPointClick;

	useEffect(() => {
		if (!map || !isLoaded) return;

		if (!map.getSource(sourceId)) {
			map.addSource(sourceId, {
				type: "geojson",
				data,
			} as Parameters<typeof map.addSource>[1]);
		}

		if (!map.getLayer(heatLayerId)) {
			map.addLayer({
				id: heatLayerId,
				type: "heatmap",
				source: sourceId,
				maxzoom: 16,
				paint: {
					"heatmap-weight": 1,
					"heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.7, 16, 1.3],
					"heatmap-color": [
						"interpolate",
						["linear"],
						["heatmap-density"],
						0,
						"rgba(59, 130, 246, 0)",
						...HEATMAP_STOPS,
					],
					"heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 14, 16, 44],
					"heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.85, 16, 0.45],
				},
			} as Parameters<typeof map.addLayer>[0]);
		}

		if (!map.getLayer(pointLayerId)) {
			map.addLayer({
				id: pointLayerId,
				type: "circle",
				source: sourceId,
				minzoom: 12,
				paint: {
					"circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 3, 16, 7],
					"circle-color": HEATMAP_COLORS[3],
					"circle-stroke-width": 1,
					"circle-stroke-color": "rgba(255,255,255,0.8)",
					"circle-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0, 14, 0.85],
				},
			} as Parameters<typeof map.addLayer>[0]);
		}

		const handleClick = (event: PointClickEvent) => {
			const feature = event.features?.[0];
			if (!feature || feature.geometry.type !== "Point") return;
			const coordinates = feature.geometry.coordinates as [number, number];
			onPointClickRef.current?.(feature.properties as MemberProps, coordinates);
		};
		const handleEnter = () => {
			map.getCanvas().style.cursor = "pointer";
		};
		const handleLeave = () => {
			map.getCanvas().style.cursor = "";
		};
		map.on("click", pointLayerId, handleClick);
		map.on("mouseenter", pointLayerId, handleEnter);
		map.on("mouseleave", pointLayerId, handleLeave);

		return () => {
			try {
				map.off("click", pointLayerId, handleClick);
				map.off("mouseenter", pointLayerId, handleEnter);
				map.off("mouseleave", pointLayerId, handleLeave);
				if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
				if (map.getLayer(heatLayerId)) map.removeLayer(heatLayerId);
				if (map.getSource(sourceId)) map.removeSource(sourceId);
			} catch {
				// ignore — map may already be torn down
			}
		};
	}, [map, isLoaded, data, sourceId, heatLayerId, pointLayerId]);

	return null;
}

export function MemberMap() {
	const [mounted, setMounted] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("cluster");
	const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
	const [selected, setSelected] = useState<{
		coordinates: [number, number];
		properties: MemberProps;
	} | null>(null);

	// MapLibre is client-only — render the map after mount to avoid SSR access.
	useEffect(() => {
		setMounted(true);
	}, []);

	const mapQuery = useQuery(statisticsMemberMapQueryOptions());
	const groupsQuery = useQuery(groupsQueryOptions());

	const members = mapQuery.data?.members ?? [];
	const groupOptions = (groupsQuery.data ?? []).map((group) => ({
		id: group.id,
		name: group.name,
	}));

	const filtered = useMemo(
		() =>
			members.filter((member) => {
				if (member.latitude == null || member.longitude == null) return false;
				if (selectedGroups.size === 0) return true;
				return member.groupIds.some((groupId) => selectedGroups.has(groupId));
			}),
		[members, selectedGroups],
	);

	const featureCollection = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, MemberProps>>(
		() => ({
			type: "FeatureCollection",
			features: filtered.map((member) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [member.longitude as number, member.latitude as number],
				},
				properties: {
					memberId: member.memberId,
					name: `${member.firstName} ${member.lastName}`.trim(),
					city: member.city,
					postalCode: member.postalCode,
				},
			})),
		}),
		[filtered],
	);

	const center = useMemo<[number, number]>(() => {
		const withCoords = members.filter((m) => m.latitude != null && m.longitude != null);
		if (withCoords.length === 0) return FALLBACK_CENTER;
		const lng = withCoords.reduce((sum, m) => sum + (m.longitude as number), 0) / withCoords.length;
		const lat = withCoords.reduce((sum, m) => sum + (m.latitude as number), 0) / withCoords.length;
		return [lng, lat];
	}, [members]);

	function toggleGroup(groupId: string) {
		setSelectedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) {
				next.delete(groupId);
			} else {
				next.add(groupId);
			}
			return next;
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Menu>
					<MenuTrigger render={<Button variant="outline" />}>
						<ListFilterIcon />
						Gruppen
						{selectedGroups.size > 0 ? (
							<span className="ml-1 rounded bg-primary/10 px-1.5 text-primary text-xs">
								{selectedGroups.size}
							</span>
						) : null}
					</MenuTrigger>
					<MenuPopup align="start" className="w-52">
						<MenuGroup>
							<MenuGroupLabel>Nach Gruppe filtern</MenuGroupLabel>
							{groupOptions.length === 0 ? (
								<p className="px-2 py-1.5 text-muted-foreground text-sm">Keine Gruppen</p>
							) : (
								groupOptions.map((group) => (
									<MenuCheckboxItem
										key={group.id}
										checked={selectedGroups.has(group.id)}
										closeOnClick={false}
										onCheckedChange={() => toggleGroup(group.id)}
									>
										{group.name}
									</MenuCheckboxItem>
								))
							)}
						</MenuGroup>
					</MenuPopup>
				</Menu>

				<Tabs
					value={viewMode}
					onValueChange={(value) => {
						setViewMode(value as ViewMode);
						setSelected(null);
					}}
				>
					<TabsList>
						<TabsTab value="cluster">
							<GridIcon />
							Cluster
						</TabsTab>
						<TabsTab value="heatmap">
							<FlameIcon />
							Heatmap
						</TabsTab>
					</TabsList>
				</Tabs>
			</div>

			<div className="relative h-[600px] w-full overflow-hidden rounded-xl border bg-muted/30">
				{mounted && mapQuery.isError ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
						<p className="text-muted-foreground text-sm">
							{parseError(mapQuery.error).message}
						</p>
						<Button onClick={() => mapQuery.refetch()} size="sm" variant="outline">
							Erneut versuchen
						</Button>
					</div>
				) : mounted ? (
					<Map
						key={mapQuery.isSuccess ? "ready" : "loading"}
						center={center}
						loading={mapQuery.isPending}
						zoom={10}
					>
						{viewMode === "cluster" ? (
							<MapClusterLayer<MemberProps>
								clusterColors={["#3b82f6", "#8b5cf6", "#ec4899"]}
								clusterThresholds={[8, 20]}
								data={featureCollection}
								pointColor="#3b82f6"
								onPointClick={(feature, coordinates) =>
									setSelected({ coordinates, properties: feature.properties })
								}
							/>
						) : (
							<MemberHeatmapLayer
								data={featureCollection}
								onPointClick={(properties, coordinates) =>
									setSelected({ coordinates, properties })
								}
							/>
						)}

						{selected ? (
							<MapPopup
								key={`${selected.coordinates[0]}-${selected.coordinates[1]}`}
								closeButton
								closeOnClick={false}
								latitude={selected.coordinates[1]}
								longitude={selected.coordinates[0]}
								onClose={() => setSelected(null)}
							>
								<div className="space-y-1 pr-4">
									<p className="font-semibold text-sm">{selected.properties.name}</p>
									<p className="text-muted-foreground text-xs">
										{selected.properties.postalCode} {selected.properties.city}
									</p>
								</div>
							</MapPopup>
						) : null}

						<MapControls position="bottom-right" showCompass showFullscreen showLocate showZoom />
					</Map>
				) : null}

				{mounted && viewMode === "heatmap" ? (
					<div className="absolute top-3 left-3 z-10 w-44 rounded-lg border bg-popover/90 p-3 backdrop-blur-sm">
						<p className="font-medium text-xs">Mitgliederdichte</p>
						<div className="mt-2 grid grid-cols-5 gap-1">
							{HEATMAP_COLORS.map((color) => (
								<span
									key={color}
									className="h-2 rounded-full"
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
						<div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
							<span>Niedrig</span>
							<span>Hoch</span>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
