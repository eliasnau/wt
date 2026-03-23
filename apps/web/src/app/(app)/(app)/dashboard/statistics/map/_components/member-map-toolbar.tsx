"use client";

import { FlameIcon, GridIcon, ListFilterIcon, MapIcon } from "lucide-react";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import {
	Menu,
	MenuCheckboxItem,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";

export type ViewMode = "cluster" | "heatmap";

type GroupOption = {
	label: string;
	value: string;
};

type MapStyleOption = {
	label: string;
	light: string;
	dark: string;
};

type MemberMapToolbarProps = {
	groupOptions: GroupOption[];
	selectedGroups: string[];
	onSelectedGroupsChange: (value: string[]) => void;
	viewMode: ViewMode;
	onViewModeChange: (value: ViewMode) => void;
	includeActive: boolean;
	includeCancelled: boolean;
	includeCancelledButActive: boolean;
	onIncludeActiveChange: (value: boolean) => void;
	onIncludeCancelledChange: (value: boolean) => void;
	onIncludeCancelledButActiveChange: (value: boolean) => void;
	mapStyleKey: string;
	mapStyles: Record<string, MapStyleOption>;
	onMapStyleChange: (value: string) => void;
};

export function MemberMapToolbar({
	groupOptions,
	selectedGroups,
	onSelectedGroupsChange,
	viewMode,
	onViewModeChange,
	includeActive,
	includeCancelled,
	includeCancelledButActive,
	onIncludeActiveChange,
	onIncludeCancelledChange,
	onIncludeCancelledButActiveChange,
	mapStyleKey,
	mapStyles,
	onMapStyleChange,
}: MemberMapToolbarProps) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<DataTableFacetedFilter
					title="Gruppen"
					options={groupOptions}
					selectedValues={selectedGroups}
					onValueChange={onSelectedGroupsChange}
					buttonSize="default"
				/>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<Menu>
					<MenuTrigger render={<Button variant="outline" size="default" />}>
						<ListFilterIcon className="size-4" />
						<span className="ml-1.5 hidden sm:inline">Mitglieder</span>
					</MenuTrigger>
					<MenuPopup align="end" className="w-[280px]">
						<MenuGroup>
							<MenuGroupLabel>Anzuzeigende Mitglieder</MenuGroupLabel>
							<MenuCheckboxItem
								variant="switch"
								checked={includeActive}
								onCheckedChange={(checked) =>
									onIncludeActiveChange(Boolean(checked))
								}
							>
								Aktive Mitglieder
							</MenuCheckboxItem>
							<MenuCheckboxItem
								variant="switch"
								checked={includeCancelled}
								onCheckedChange={(checked) =>
									onIncludeCancelledChange(Boolean(checked))
								}
							>
								Gekuendigte Mitglieder
							</MenuCheckboxItem>
							<MenuCheckboxItem
								variant="switch"
								checked={includeCancelledButActive}
								onCheckedChange={(checked) =>
									onIncludeCancelledButActiveChange(Boolean(checked))
								}
							>
								Gekuendigt, noch aktiv
							</MenuCheckboxItem>
						</MenuGroup>
					</MenuPopup>
				</Menu>

				<Menu>
					<MenuTrigger render={<Button variant="outline" size="default" />}>
						{viewMode === "cluster" ? (
							<GridIcon className="size-4" />
						) : (
							<FlameIcon className="size-4" />
						)}
						<span className="ml-1.5 hidden sm:inline">
							{viewMode === "cluster" ? "Cluster" : "Heatmap"}
						</span>
					</MenuTrigger>
					<MenuPopup align="end" className="w-[150px]">
						<MenuGroup>
							<MenuGroupLabel>Ansicht</MenuGroupLabel>
							<MenuItem
								onClick={() => onViewModeChange("cluster")}
								className={cn(viewMode === "cluster" && "bg-accent")}
							>
								<GridIcon className="size-4" />
								Cluster
							</MenuItem>
							<MenuItem
								onClick={() => onViewModeChange("heatmap")}
								className={cn(viewMode === "heatmap" && "bg-accent")}
							>
								<FlameIcon className="size-4" />
								Heatmap
							</MenuItem>
						</MenuGroup>
					</MenuPopup>
				</Menu>

				<Menu>
					<MenuTrigger render={<Button variant="outline" size="default" />}>
						<MapIcon className="size-4" />
						<span className="ml-1.5 hidden sm:inline">
							{mapStyles[mapStyleKey]?.label}
						</span>
					</MenuTrigger>
					<MenuPopup align="end" className="w-[180px]">
						<MenuGroup>
							<MenuGroupLabel>Kartenstil</MenuGroupLabel>
							{Object.entries(mapStyles).map(([key, style]) => (
								<MenuItem
									key={key}
									onClick={() => onMapStyleChange(key)}
									className={cn(mapStyleKey === key && "bg-accent")}
								>
									{style.label}
								</MenuItem>
							))}
						</MenuGroup>
					</MenuPopup>
				</Menu>
			</div>
		</div>
	);
}
