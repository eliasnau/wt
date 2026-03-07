"use client";

import {
	ArrowDownAZIcon,
	ArrowDownZAIcon,
	ClockArrowDownIcon,
	ClockArrowUpIcon,
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

const DATE_SORT_FIELDS = new Set([
	"createdAt",
	"updatedAt",
	"startDate",
	"cancellationEffectiveDate",
	"cancelledAt",
]);

type MembersV2ControlsProps = {
	localSearch: string;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
	groupOptions: Option[];
	groupIds: string[];
	onGroupIdsChange: (groupIds: string[]) => void;
	showSelectedOnly: boolean;
	onShowAllMembers: () => void;
	sortFieldOptions: Option[];
	sortDirectionOptions: Option[];
	sortField: string;
	sortDirection: string;
	onSortFieldChange: (value: string) => void;
	onSortDirectionChange: (value: string) => void;
	canExportCsv: boolean;
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
	showSelectedOnly,
	onShowAllMembers,
	sortFieldOptions,
	sortDirectionOptions,
	sortField,
	sortDirection,
	onSortFieldChange,
	onSortDirectionChange,
	canExportCsv,
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
	const isDateSort = DATE_SORT_FIELDS.has(sortField);
	const SortDirectionIcon =
		sortDirection === "asc"
			? isDateSort
				? ClockArrowUpIcon
				: ArrowDownAZIcon
			: isDateSort
				? ClockArrowDownIcon
				: ArrowDownZAIcon;

	return (
		<TooltipProvider>
			<div className="min-w-0 max-w-full space-y-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
					<InputGroup className="w-[260px] max-w-full sm:w-[320px] lg:w-[360px]">
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
				<div className="flex flex-wrap items-center justify-end gap-2">
					{showSelectedOnly && (
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="outline" size="sm" onClick={onShowAllMembers} />
								}
							>
								Alle Mitglieder anzeigen
							</TooltipTrigger>
							<TooltipContent>Hebt die interne Auswahlansicht auf</TooltipContent>
						</Tooltip>
					)}
					{hasActiveFilters && (
						<Tooltip>
							<TooltipTrigger
								render={
									<Button variant="ghost" size="sm" onClick={onResetAllFilters} />
								}
							>
								<XIcon />
								Alles zurücksetzen
							</TooltipTrigger>
							<TooltipContent>Setzt sichtbare Filter zurück</TooltipContent>
						</Tooltip>
					)}
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Tooltip>
						<Popover>
							<PopoverTrigger
								render={
									<TooltipTrigger render={<Button variant="outline" size="sm" />}>
										<SortDirectionIcon />
										Sortierung
									</TooltipTrigger>
								}
							/>
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
										onValueChange={(value) => {
											if (!value) return;
											onSortFieldChange(value);
										}}
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
										onValueChange={(value) => {
											if (!value) return;
											onSortDirectionChange(value);
										}}
									>
										<SelectTrigger>
											<SortDirectionIcon />
											<SelectValue />
										</SelectTrigger>
										<SelectPopup>
											{sortDirectionOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													<span className="inline-flex items-center gap-2">
														{option.value === "asc" ? (
															isDateSort ? (
																<ClockArrowUpIcon />
															) : (
																<ArrowDownAZIcon />
															)
														) : isDateSort ? (
															<ClockArrowDownIcon />
														) : (
															<ArrowDownZAIcon />
														)}
														<span>{option.label}</span>
													</span>
												</SelectItem>
											))}
										</SelectPopup>
									</Select>
								</div>
							</PopoverPopup>
						</Popover>
						<TooltipContent>Sortierung und Reihenfolge anpassen</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									disabled={!canExportCsv || exportPending}
									variant="outline"
									size="sm"
									className="px-2 sm:px-3"
									onClick={onExportCsv}
								/>
							}
						>
							{exportPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<DownloadIcon />
							)}
							<span className="hidden sm:inline">CSV-Export</span>
						</TooltipTrigger>
						<TooltipContent>Aktuelle Mitgliederliste exportieren</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="outline"
									size="icon-sm"
									className="sm:hidden"
									onClick={onOpenAdvancedSheet}
								/>
							}
						>
							<SlidersHorizontalIcon />
							<span className="sr-only">Advanced Builder öffnen</span>
						</TooltipTrigger>
						<TooltipContent>Erweiterte Filter auf Mobilgeräten</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="outline"
									size="sm"
									className="hidden sm:inline-flex"
									onClick={onToggleAdvancedDesktop}
								/>
							}
						>
							<SlidersHorizontalIcon />
							Advanced Builder
							{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
						</TooltipTrigger>
						<TooltipContent>Erweiterte Filter ein- oder ausblenden</TooltipContent>
					</Tooltip>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{hasActiveFilters && (
						<Tooltip>
							<TooltipTrigger
								render={<Button variant="outline" size="sm" onClick={onSaveView} />}
							>
								Speichern
							</TooltipTrigger>
							<TooltipContent>Aktuelle Filter als Ansicht speichern</TooltipContent>
						</Tooltip>
					)}
					<Tooltip>
						<TooltipTrigger
							render={
								<Button size="icon-sm" variant="outline" onClick={onOpenSavedViews} />
							}
						>
							<EyeIcon />
						</TooltipTrigger>
						<TooltipContent>Gespeicherte Ansichten öffnen</TooltipContent>
					</Tooltip>

					<Tooltip>
						<Menu>
							<MenuTrigger
								render={
									<TooltipTrigger render={<Button size="icon-sm" variant="outline" />}>
										<MoreVerticalIcon />
									</TooltipTrigger>
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
						<TooltipContent>Weitere Filteroptionen</TooltipContent>
					</Tooltip>
				</div>
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
		</TooltipProvider>
	);
}
