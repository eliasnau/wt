"use client";

import {
	ArrowUpDownIcon,
	DownloadIcon,
	EyeIcon,
	Loader2,
	MoreVerticalIcon,
	SearchIcon,
	SlidersHorizontalIcon,
	XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Menu,
	MenuCheckboxItem,
	MenuPopup,
	MenuTrigger,
} from "@/components/ui/menu";
import {
	Popover,
	PopoverDescription,
	PopoverPopup,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type Option = {
	label: string;
	value: string;
};

type MembersV2ControlsProps = {
	localSearch: string;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
	groupOptions: Option[];
	groupIds: string[];
	onGroupIdsChange: (groupIds: string[]) => void;
	sortFieldOptions: Option[];
	sortDirectionOptions: Option[];
	sortField: string;
	sortDirection: string;
	onSortFieldChange: (value: string) => void;
	onSortDirectionChange: (value: string) => void;
	onExportCsv: () => void;
	exportPending: boolean;
	onOpenAdvancedSheet: () => void;
	onToggleAdvancedDesktop: () => void;
	advancedFilterCount: number;
	onOpenSavedViews: () => void;
	includeActive: boolean;
	includeCancelled: boolean;
	includeCancelledButActive: boolean;
	onIncludeActiveChange: (checked: boolean) => void;
	onIncludeCancelledChange: (checked: boolean) => void;
	onIncludeCancelledButActiveChange: (checked: boolean) => void;
	hasActiveFilters: boolean;
	onSaveView: () => void;
	onResetAllFilters: () => void;
	advancedOpen: boolean;
	onAdvancedOpenChange: (open: boolean) => void;
	advancedSheetOpen: boolean;
	onAdvancedSheetOpenChange: (open: boolean) => void;
	advancedFiltersPanel: ReactNode;
};

export function MembersV2Controls({
	localSearch,
	onSearchChange,
	onClearSearch,
	groupOptions,
	groupIds,
	onGroupIdsChange,
	sortFieldOptions,
	sortDirectionOptions,
	sortField,
	sortDirection,
	onSortFieldChange,
	onSortDirectionChange,
	onExportCsv,
	exportPending,
	onOpenAdvancedSheet,
	onToggleAdvancedDesktop,
	advancedFilterCount,
	onOpenSavedViews,
	includeActive,
	includeCancelled,
	includeCancelledButActive,
	onIncludeActiveChange,
	onIncludeCancelledChange,
	onIncludeCancelledButActiveChange,
	hasActiveFilters,
	onSaveView,
	onResetAllFilters,
	advancedOpen,
	onAdvancedOpenChange,
	advancedSheetOpen,
	onAdvancedSheetOpenChange,
	advancedFiltersPanel,
}: MembersV2ControlsProps) {
	return (
		<div className="space-y-2">
			<div className="space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-2 sm:space-y-0">
				<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap sm:items-center">
					<InputGroup className="w-full sm:w-[280px] sm:flex-none md:w-[320px]">
						<InputGroupAddon>
							<SearchIcon className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							type="text"
							placeholder="Suche über Name, E-Mail, Telefon, Adresse, Vertragsfelder..."
							value={localSearch}
							onChange={(event) => onSearchChange(event.target.value)}
						/>
						{localSearch !== "" && (
							<InputGroupAddon
								align="inline-end"
								className="cursor-pointer"
								onClick={onClearSearch}
							>
								<XIcon className="size-4" />
							</InputGroupAddon>
						)}
					</InputGroup>

					<DataTableFacetedFilter
						title="Gruppen"
						options={groupOptions}
						selectedValues={groupIds}
						buttonSize="default"
						onValueChange={onGroupIdsChange}
					/>
				</div>

				<div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
					<Popover>
						<PopoverTrigger render={<Button variant="outline" size="sm" />}>
							<ArrowUpDownIcon />
							Sortierung
						</PopoverTrigger>
						<PopoverPopup align="end" className="w-[320px]">
							<div className="grid gap-3">
								<div className="space-y-1">
									<PopoverTitle className="text-base">Sortierung</PopoverTitle>
									<PopoverDescription>
										Feld und Reihenfolge wählen.
									</PopoverDescription>
								</div>
								<Select
									items={sortFieldOptions}
									value={sortField}
									onValueChange={onSortFieldChange}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										{sortFieldOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectPopup>
								</Select>
								<Select
									items={sortDirectionOptions}
									value={sortDirection}
									onValueChange={onSortDirectionChange}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										{sortDirectionOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectPopup>
								</Select>
							</div>
						</PopoverPopup>
					</Popover>
					<Button
						variant="outline"
						size="sm"
						className="px-2 sm:px-3"
						onClick={onExportCsv}
						disabled={exportPending}
					>
						{exportPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<DownloadIcon />
						)}
						<span className="hidden sm:inline">CSV export</span>
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						className="sm:hidden"
						onClick={onOpenAdvancedSheet}
					>
						<SlidersHorizontalIcon />
						<span className="sr-only">Advanced Builder öffnen</span>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="hidden sm:inline-flex"
						onClick={onToggleAdvancedDesktop}
					>
						<SlidersHorizontalIcon />
						Advanced Builder
						{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
					</Button>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button size="icon-sm" variant="outline" onClick={onOpenSavedViews} />
								}
							>
								<EyeIcon />
							</TooltipTrigger>
							<TooltipContent>Ansichten</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<Menu>
						<MenuTrigger
							render={
								<Button size="icon-sm" variant="outline">
									<MoreVerticalIcon />
								</Button>
							}
						/>
						<MenuPopup align="end" className="w-[280px]">
							<MenuCheckboxItem
								variant="switch"
								checked={includeActive}
								onCheckedChange={(checked) => onIncludeActiveChange(Boolean(checked))}
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
								Gekündigte Mitglieder
							</MenuCheckboxItem>
							<MenuCheckboxItem
								variant="switch"
								checked={includeCancelledButActive}
								onCheckedChange={(checked) =>
									onIncludeCancelledButActiveChange(Boolean(checked))
								}
							>
								Gekündigt, noch aktiv
							</MenuCheckboxItem>
						</MenuPopup>
					</Menu>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2 sm:hidden">
				{hasActiveFilters && (
					<>
						<Button variant="outline" size="sm" onClick={onSaveView}>
							Speichern
						</Button>
						<Button variant="ghost" size="sm" onClick={onResetAllFilters}>
							<XIcon />
							Alles zurücksetzen
						</Button>
					</>
				)}
			</div>

			<div className="hidden sm:flex sm:items-center sm:justify-end sm:gap-2">
				{hasActiveFilters && (
					<>
						<Button variant="outline" size="sm" onClick={onSaveView}>
							Speichern
						</Button>
						<Button variant="ghost" size="sm" onClick={onResetAllFilters}>
							<XIcon />
							Alles zurücksetzen
						</Button>
					</>
				)}
			</div>

			<Collapsible
				className="hidden sm:block"
				open={advancedOpen}
				onOpenChange={onAdvancedOpenChange}
			>
				<CollapsibleContent>
					<Frame>
						<FramePanel>{advancedFiltersPanel}</FramePanel>
					</Frame>
				</CollapsibleContent>
			</Collapsible>

			<Sheet open={advancedSheetOpen} onOpenChange={onAdvancedSheetOpenChange}>
				<SheetContent side="right" className="sm:hidden">
					<SheetHeader>
						<SheetTitle>Advanced Builder</SheetTitle>
						<SheetDescription>
							Erweiterte Filter für Mitglieder konfigurieren.
						</SheetDescription>
					</SheetHeader>
					<SheetPanel>{advancedFiltersPanel}</SheetPanel>
				</SheetContent>
			</Sheet>
		</div>
	);
}
