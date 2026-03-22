"use client";

import {
	ArrowDownAZIcon,
	ArrowDownZAIcon,
	BookmarkIcon,
	CheckIcon,
	ClockArrowDownIcon,
	ClockArrowUpIcon,
	Columns3Icon,
	DownloadIcon,
	GlobeIcon,
	ListFilterIcon,
	Loader2,
	MoreHorizontalIcon,
	PrinterIcon,
	SaveIcon,
	SearchIcon,
	Share2Icon,
	SlidersHorizontalIcon,
	XIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
	Drawer,
	DrawerClose,
	DrawerMenu,
	DrawerMenuCheckboxItem,
	DrawerMenuGroup,
	DrawerMenuGroupLabel,
	DrawerMenuItem,
	DrawerMenuSeparator,
	DrawerMenuTrigger,
	DrawerPanel,
	DrawerPopup,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Menu,
	MenuCheckboxItem,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuSub,
	MenuSubPopup,
	MenuSubTrigger,
	MenuTrigger,
} from "@/components/ui/menu";
import {
	Menu as ResponsiveMenu,
	MenuCheckboxItem as ResponsiveMenuCheckboxItem,
	MenuGroup as ResponsiveMenuGroup,
	MenuGroupLabel as ResponsiveMenuGroupLabel,
	MenuItem as ResponsiveMenuItem,
	MenuPopup as ResponsiveMenuPopup,
	MenuSeparator as ResponsiveMenuSeparator,
	MenuSub as ResponsiveMenuSub,
	MenuSubPopup as ResponsiveMenuSubPopup,
	MenuSubTrigger as ResponsiveMenuSubTrigger,
	MenuTrigger as ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
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
import { useIsMobile } from "@/hooks/use-mobile";

type Option = {
	label: string;
	value: string;
};

type SystemView = {
	id: string;
	name: string;
	description: string;
};

type SavedView = {
	id: string;
	name: string;
};

const DATE_SORT_FIELDS = new Set([
	"createdAt",
	"updatedAt",
	"startDate",
	"cancellationEffectiveDate",
	"cancelledAt",
]);

// Show up to this many views inline; the rest go into a submenu
const MAX_INLINE_VIEWS = 5;

// Columns that can be toggled (non-functional placeholders)
const COLUMN_OPTIONS = [
	{ label: "Vorname", value: "firstName" },
	{ label: "Nachname", value: "lastName" },
	{ label: "E-Mail", value: "email" },
	{ label: "Telefon", value: "phone" },
	{ label: "Gruppen", value: "groups" },
];

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
	onOpenPrintSheet: () => void;
	onOpenAdvancedSheet: () => void;
	onToggleAdvancedDesktop: () => void;
	advancedFilterCount: number;
	// Saved views
	systemViews: SystemView[];
	savedViews: SavedView[];
	canSaveView: boolean;
	selectedSystemViewId: string;
	selectedSavedViewId: string;
	onApplySystemView: (id: string) => void;
	onApplySavedView: (id: string) => void;
	onSaveView: () => void;
	onRenameView: () => void;
	onDeleteSavedView: () => void;
	// Include filter (3 switches)
	includeActive: boolean;
	includeCancelled: boolean;
	includeCancelledButActive: boolean;
	onIncludeActiveChange: (checked: boolean) => void;
	onIncludeCancelledChange: (checked: boolean) => void;
	onIncludeCancelledButActiveChange: (checked: boolean) => void;
	hasActiveFilters: boolean;
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
	onOpenPrintSheet,
	onOpenAdvancedSheet,
	onToggleAdvancedDesktop,
	advancedFilterCount,
	systemViews,
	savedViews,
	canSaveView,
	selectedSystemViewId,
	selectedSavedViewId,
	onApplySystemView,
	onApplySavedView,
	onSaveView,
	onRenameView,
	onDeleteSavedView,
	includeActive,
	includeCancelled,
	includeCancelledButActive,
	onIncludeActiveChange,
	onIncludeCancelledChange,
	onIncludeCancelledButActiveChange,
	hasActiveFilters,
	onResetAllFilters,
	advancedOpen,
	onAdvancedOpenChange,
	advancedSheetOpen,
	onAdvancedSheetOpenChange,
	advancedFiltersPanel,
}: MembersV2ControlsProps) {
	const isMobile = useIsMobile();
	const isDateSort = DATE_SORT_FIELDS.has(sortField);
	const SortDirectionIcon =
		sortDirection === "asc"
			? isDateSort
				? ClockArrowUpIcon
				: ArrowDownAZIcon
			: isDateSort
				? ClockArrowDownIcon
				: ArrowDownZAIcon;

	const inlineViews = savedViews.slice(0, MAX_INLINE_VIEWS);
	const overflowViews = savedViews.slice(MAX_INLINE_VIEWS);
	const mobileFilterSnapPoints = ["320px", 1] as const;
	const [mobileFilterSnapPoint, setMobileFilterSnapPoint] = useState<
		(typeof mobileFilterSnapPoints)[number] | null
	>(mobileFilterSnapPoints[0]);

	// Mobile layout
	if (isMobile) {
		return (
			<TooltipProvider>
				<div className="w-full space-y-2">
					<InputGroup className="w-full">
						<InputGroupAddon>
							<SearchIcon className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							type="text"
							placeholder="Suche..."
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

					<div className="flex w-full items-center justify-between gap-2">
						<div className="shrink-0">
							<DataTableFacetedFilter
								title="Gruppen"
								options={groupOptions}
								selectedValues={groupIds}
								buttonSize="default"
								onValueChange={onGroupIdsChange}
							/>
						</div>

						<div className="flex items-center gap-2">
							<Drawer
								onSnapPointChange={(point) =>
									setMobileFilterSnapPoint(
										point as (typeof mobileFilterSnapPoints)[number] | null,
									)
								}
								position="bottom"
								snapPoint={mobileFilterSnapPoint}
								snapPoints={[...mobileFilterSnapPoints]}
								snapToSequentialPoints
							>
								<DrawerTrigger
									render={<Button variant="outline" size="default" />}
								>
									<SlidersHorizontalIcon />
									Filter
								</DrawerTrigger>
								<DrawerPopup showBar>
									<DrawerPanel>
										<DrawerMenu>
										<DrawerMenuGroup>
											<DrawerMenuGroupLabel>Filter</DrawerMenuGroupLabel>
										</DrawerMenuGroup>

										<Drawer>
											<DrawerMenuTrigger>
												<SortDirectionIcon />
												Sortierung
											</DrawerMenuTrigger>
											<DrawerPopup showBar>
												<DrawerPanel>
													<DrawerMenu>
														<DrawerMenuGroup>
															<DrawerMenuGroupLabel>
																Sortierfeld
															</DrawerMenuGroupLabel>
														</DrawerMenuGroup>
														{sortFieldOptions.map((option) => (
															<DrawerClose
																key={option.value}
																render={
																	<DrawerMenuItem
																		onClick={() =>
																			onSortFieldChange(option.value)
																		}
																	/>
																}
															>
																{sortField === option.value && <CheckIcon />}
																{option.label}
															</DrawerClose>
														))}
														<DrawerMenuSeparator />
														<DrawerMenuGroup>
															<DrawerMenuGroupLabel>
																Reihenfolge
															</DrawerMenuGroupLabel>
														</DrawerMenuGroup>
														{sortDirectionOptions.map((option) => (
															<DrawerClose
																key={option.value}
																render={
																	<DrawerMenuItem
																		onClick={() =>
																			onSortDirectionChange(option.value)
																		}
																	/>
																}
															>
																{sortDirection === option.value && (
																	<CheckIcon />
																)}
																{option.label}
															</DrawerClose>
														))}
													</DrawerMenu>
												</DrawerPanel>
											</DrawerPopup>
										</Drawer>

										<DrawerMenuSeparator />

										<Drawer>
											<DrawerMenuTrigger>
												<ListFilterIcon />
												Anzuzeigende Mitglieder
											</DrawerMenuTrigger>
											<DrawerPopup showBar>
												<DrawerPanel>
													<DrawerMenu>
														<DrawerMenuGroup>
															<DrawerMenuGroupLabel>
																Anzuzeigende Mitglieder
															</DrawerMenuGroupLabel>
														</DrawerMenuGroup>
														<DrawerMenuCheckboxItem
															variant="switch"
															checked={includeActive}
															onCheckedChange={(checked) =>
																onIncludeActiveChange(Boolean(checked))
															}
														>
															Aktive Mitglieder
														</DrawerMenuCheckboxItem>
														<DrawerMenuCheckboxItem
															variant="switch"
															checked={includeCancelled}
															onCheckedChange={(checked) =>
																onIncludeCancelledChange(Boolean(checked))
															}
														>
															Gekündigte Mitglieder
														</DrawerMenuCheckboxItem>
														<DrawerMenuCheckboxItem
															variant="switch"
															checked={includeCancelledButActive}
															onCheckedChange={(checked) =>
																onIncludeCancelledButActiveChange(
																	Boolean(checked),
																)
															}
														>
															Gekündigt, noch aktiv
														</DrawerMenuCheckboxItem>
													</DrawerMenu>
												</DrawerPanel>
											</DrawerPopup>
										</Drawer>

										<DrawerMenuSeparator />

										<Drawer>
											<DrawerMenuTrigger>
												<SlidersHorizontalIcon />
												Advanced Builder
												{advancedFilterCount > 0
													? ` (${advancedFilterCount})`
													: ""}
											</DrawerMenuTrigger>
											<DrawerPopup showBar>
												<DrawerPanel>
													<DrawerMenu>
														<DrawerMenuGroup>
															<DrawerMenuGroupLabel>
																Advanced Builder
															</DrawerMenuGroupLabel>
														</DrawerMenuGroup>
														<div className="px-4 py-2">
															{advancedFiltersPanel}
														</div>
													</DrawerMenu>
												</DrawerPanel>
											</DrawerPopup>
										</Drawer>

										<DrawerMenuSeparator />

										<Drawer>
											<DrawerMenuTrigger>
												<BookmarkIcon />
												Voreinstellungen
											</DrawerMenuTrigger>
											<DrawerPopup showBar>
												<DrawerPanel>
													<DrawerMenu>
														<DrawerMenuGroup>
															<DrawerMenuGroupLabel>
																Aktionen
															</DrawerMenuGroupLabel>
														</DrawerMenuGroup>
														{!selectedSavedViewId && (
															<DrawerClose
																render={
																	<DrawerMenuItem
																		disabled={!canSaveView}
																		onClick={
																			canSaveView ? onSaveView : undefined
																		}
																	/>
																}
															>
																<SaveIcon />
																{canSaveView
																	? "Neue Ansicht speichern"
																	: "Filter anpassen zum Speichern"}
															</DrawerClose>
														)}
														{selectedSavedViewId && (
															<>
																<DrawerClose
																	render={
																		<DrawerMenuItem onClick={onRenameView} />
																	}
																>
																	<SaveIcon />
																	Aktuelle Ansicht umbenennen
																</DrawerClose>
																<DrawerClose
																	render={
																		<DrawerMenuItem
																			variant="destructive"
																			onClick={onDeleteSavedView}
																		/>
																	}
																>
																	<XIcon />
																	Aktuelle Ansicht löschen
																</DrawerClose>
															</>
														)}
														<DrawerMenuSeparator />
														<DrawerMenuGroup>
															<DrawerMenuGroupLabel>
																Systemansichten
															</DrawerMenuGroupLabel>
														</DrawerMenuGroup>
														{systemViews.map((view) => (
															<DrawerClose
																key={view.id}
																render={
																	<DrawerMenuItem
																		onClick={() => onApplySystemView(view.id)}
																	/>
																}
															>
																{selectedSystemViewId === view.id ? (
																	<CheckIcon />
																) : (
																	<GlobeIcon />
																)}
																{view.name}
															</DrawerClose>
														))}
														{savedViews.length > 0 && (
															<>
																<DrawerMenuSeparator />
																<DrawerMenuGroup>
																	<DrawerMenuGroupLabel>
																		Eigene Ansichten
																	</DrawerMenuGroupLabel>
																</DrawerMenuGroup>
																{savedViews.map((view) => (
																	<DrawerClose
																		key={view.id}
																		render={
																			<DrawerMenuItem
																				onClick={() =>
																					onApplySavedView(view.id)
																				}
																			/>
																		}
																	>
																		{selectedSavedViewId === view.id ? (
																			<CheckIcon />
																		) : (
																			<BookmarkIcon />
																		)}
																		{view.name}
																	</DrawerClose>
																))}
															</>
														)}
													</DrawerMenu>
												</DrawerPanel>
											</DrawerPopup>
										</Drawer>

										{hasActiveFilters && (
											<>
												<DrawerMenuSeparator />
												<DrawerMenuGroup>
													<DrawerMenuGroupLabel>Aktionen</DrawerMenuGroupLabel>
												</DrawerMenuGroup>
												<DrawerClose
													render={
														<DrawerMenuItem
															variant="destructive"
															onClick={onResetAllFilters}
														/>
													}
												>
													<XIcon />
													Filter zurücksetzen
												</DrawerClose>
											</>
										)}
										</DrawerMenu>
									</DrawerPanel>
								</DrawerPopup>
							</Drawer>

							<ResponsiveMenu>
								<ResponsiveMenuTrigger
									render={<Button size="icon" variant="outline" />}
								>
									<MoreHorizontalIcon />
								</ResponsiveMenuTrigger>
								<ResponsiveMenuPopup align="end" className="w-[240px]">
									<ResponsiveMenuSub>
										<ResponsiveMenuSubTrigger>
											<Columns3Icon />
											Spalten ein-/ausblenden
										</ResponsiveMenuSubTrigger>
										<ResponsiveMenuSubPopup className="w-[220px]">
											<ResponsiveMenuGroup>
												<ResponsiveMenuGroupLabel>
													Spalten ein-/ausblenden
												</ResponsiveMenuGroupLabel>
												{COLUMN_OPTIONS.map((col) => (
													<ResponsiveMenuCheckboxItem
														key={col.value}
														checked
														disabled
													>
														{col.label}
													</ResponsiveMenuCheckboxItem>
												))}
											</ResponsiveMenuGroup>
										</ResponsiveMenuSubPopup>
									</ResponsiveMenuSub>

									<ResponsiveMenuSeparator />

									<ResponsiveMenuGroup>
										<ResponsiveMenuGroupLabel>Export</ResponsiveMenuGroupLabel>
										<ResponsiveMenuItem
											disabled={!canExportCsv || exportPending}
											onClick={onExportCsv}
										>
											{exportPending ? (
												<Loader2 className="animate-spin" />
											) : (
												<DownloadIcon />
											)}
											CSV-Liste exportieren
										</ResponsiveMenuItem>
										<ResponsiveMenuItem onClick={onOpenPrintSheet}>
											<PrinterIcon />
											Liste drucken
										</ResponsiveMenuItem>
									</ResponsiveMenuGroup>

									<ResponsiveMenuSeparator />

									<ResponsiveMenuGroup>
										<ResponsiveMenuGroupLabel>Teilen</ResponsiveMenuGroupLabel>
										<ResponsiveMenuItem disabled>
											<Share2Icon />
											Aktuelle Ansicht teilen
										</ResponsiveMenuItem>
									</ResponsiveMenuGroup>
								</ResponsiveMenuPopup>
							</ResponsiveMenu>
						</div>
					</div>

					{showSelectedOnly && (
						<Button
							variant="outline"
							size="sm"
							onClick={onShowAllMembers}
							className="w-full"
						>
							Alle Mitglieder anzeigen
						</Button>
					)}
				</div>
			</TooltipProvider>
		);
	}
	// Desktop layout (unchanged)
	return (
		<TooltipProvider>
			<div className="w-full space-y-2">
				{/* Row 1: Search + Group filter + contextual reset */}
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex w-full min-w-0 flex-1 flex-wrap items-center gap-2">
						<InputGroup className="w-full max-w-full sm:w-[320px] lg:w-[360px]">
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
										<Button
											variant="outline"
											size="sm"
											onClick={onShowAllMembers}
										/>
									}
								>
									Alle Mitglieder anzeigen
								</TooltipTrigger>
								<TooltipContent>
									Hebt die interne Auswahlansicht auf
								</TooltipContent>
							</Tooltip>
						)}
						{hasActiveFilters && (
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											variant="ghost"
											size="sm"
											onClick={onResetAllFilters}
										/>
									}
								>
									<XIcon />
									Filter zurücksetzen
								</TooltipTrigger>
								<TooltipContent>
									Setzt alle aktiven Filter zurück
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				</div>

				{/* Row 2: Tool controls */}
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-2">
						{/* Sort popover */}
						<Tooltip>
							<Popover>
								<PopoverTrigger
									render={
										<TooltipTrigger
											render={<Button variant="outline" size="sm" />}
										>
											<SortDirectionIcon />
											Sortierung
										</TooltipTrigger>
									}
								/>
								<PopoverPopup align="start" className="w-[320px]">
									<div className="grid gap-3">
										<div className="space-y-1">
											<PopoverTitle className="text-base">
												Sortierung
											</PopoverTitle>
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
							<TooltipContent>
								Sortierung und Reihenfolge anpassen
							</TooltipContent>
						</Tooltip>

						{/* Advanced builder toggle — mobile */}
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
							<TooltipContent>
								Erweiterte Filter auf Mobilgeräten
							</TooltipContent>
						</Tooltip>

						{/* Advanced builder toggle — desktop */}
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
							<TooltipContent>
								Erweiterte Filter ein- oder ausblenden
							</TooltipContent>
						</Tooltip>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* What-to-include filter — now with ListFilterIcon instead of 3-dots */}
						<Tooltip>
							<Menu>
								<MenuTrigger
									render={
										<TooltipTrigger
											render={<Button size="sm" variant="outline" />}
										>
											<ListFilterIcon />
											<span className="hidden sm:inline">Mitglieder</span>
										</TooltipTrigger>
									}
								/>
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
									</MenuGroup>
								</MenuPopup>
							</Menu>
							<TooltipContent>Angezeigte Mitglieder filtern</TooltipContent>
						</Tooltip>

						{/* Saved views menu — inline, no dialog */}
						<Tooltip>
							<Menu>
								<MenuTrigger
									render={
										<TooltipTrigger
											render={<Button size="sm" variant="outline" />}
										>
											<BookmarkIcon />
											<span className="hidden sm:inline">Ansichten</span>
										</TooltipTrigger>
									}
								/>
								<MenuPopup align="end" className="w-[260px]">
									{/* Save current */}
									{!selectedSavedViewId && (
										<MenuItem
											disabled={!canSaveView}
											onClick={canSaveView ? onSaveView : undefined}
										>
											<SaveIcon />
											{canSaveView
												? "Neue Ansicht speichern"
												: "Filter anpassen zum Speichern"}
										</MenuItem>
									)}

									{selectedSavedViewId && (
										<>
											<MenuItem onClick={onRenameView}>
												<SaveIcon />
												Aktuelle Ansicht umbenennen
											</MenuItem>
											<MenuItem
												onClick={onDeleteSavedView}
												className="text-destructive-foreground"
											>
												<XIcon />
												Aktuelle Ansicht löschen
											</MenuItem>
										</>
									)}

									<MenuSeparator />

									{/* System views */}
									<MenuGroup>
										<MenuGroupLabel>Systemansichten</MenuGroupLabel>
										{systemViews.map((view) => (
											<MenuItem
												key={view.id}
												onClick={() => onApplySystemView(view.id)}
											>
												{selectedSystemViewId === view.id ? (
													<CheckIcon />
												) : (
													<GlobeIcon />
												)}
												{view.name}
											</MenuItem>
										))}
									</MenuGroup>

									{/* User saved views */}
									{savedViews.length > 0 && (
										<>
											<MenuSeparator />
											<MenuGroup>
												<MenuGroupLabel>Eigene Ansichten</MenuGroupLabel>
												{inlineViews.map((view) => (
													<MenuItem
														key={view.id}
														onClick={() => onApplySavedView(view.id)}
													>
														{selectedSavedViewId === view.id ? (
															<CheckIcon />
														) : (
															<BookmarkIcon />
														)}
														{view.name}
													</MenuItem>
												))}
												{overflowViews.length > 0 && (
													<MenuSub>
														<MenuSubTrigger>
															<MoreHorizontalIcon />
															Mehr ({overflowViews.length})
														</MenuSubTrigger>
														<MenuSubPopup>
															{overflowViews.map((view) => (
																<MenuItem
																	key={view.id}
																	onClick={() => onApplySavedView(view.id)}
																>
																	{selectedSavedViewId === view.id ? (
																		<CheckIcon />
																	) : (
																		<BookmarkIcon />
																	)}
																	{view.name}
																</MenuItem>
															))}
														</MenuSubPopup>
													</MenuSub>
												)}
											</MenuGroup>
										</>
									)}
								</MenuPopup>
							</Menu>
							<TooltipContent>Gespeicherte Ansichten</TooltipContent>
						</Tooltip>

						{/* Column visibility menu */}
						<Tooltip>
							<Menu>
								<MenuTrigger
									render={
										<TooltipTrigger
											render={<Button size="sm" variant="outline" />}
										>
											<Columns3Icon />
											<span className="hidden sm:inline">Spalten</span>
										</TooltipTrigger>
									}
								/>
								<MenuPopup align="end" className="w-[220px]">
									<MenuGroup>
										<MenuGroupLabel>Spalten ein-/ausblenden</MenuGroupLabel>
										{COLUMN_OPTIONS.map((col) => (
											<MenuCheckboxItem key={col.value} checked disabled>
												{col.label}
											</MenuCheckboxItem>
										))}
									</MenuGroup>
								</MenuPopup>
							</Menu>
							<TooltipContent>Spalten ein- oder ausblenden</TooltipContent>
						</Tooltip>

						{/* Actions menu */}
						<Tooltip>
							<Menu>
								<MenuTrigger
									render={
										<TooltipTrigger
											render={<Button size="icon-sm" variant="outline" />}
										>
											<MoreHorizontalIcon />
										</TooltipTrigger>
									}
								/>
								<MenuPopup align="end" className="w-[240px]">
									{/* Export */}
									<MenuGroup>
										<MenuGroupLabel>Export</MenuGroupLabel>
										<MenuItem
											disabled={!canExportCsv || exportPending}
											onClick={onExportCsv}
										>
											{exportPending ? (
												<Loader2 className="animate-spin" />
											) : (
												<DownloadIcon />
											)}
											CSV-Liste exportieren
										</MenuItem>
										<MenuItem onClick={onOpenPrintSheet}>
											<PrinterIcon />
											Liste drucken
										</MenuItem>
									</MenuGroup>

									<MenuSeparator />

									{/* Share */}
									<MenuGroup>
										<MenuGroupLabel>Teilen</MenuGroupLabel>
										<MenuItem disabled>
											<Share2Icon />
											Aktuelle Ansicht teilen
										</MenuItem>
									</MenuGroup>
								</MenuPopup>
							</Menu>
							<TooltipContent>Weitere Aktionen</TooltipContent>
						</Tooltip>
					</div>
				</div>

				{/* Desktop advanced filter panel */}
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

				{/* Mobile advanced filter sheet */}
				<Sheet
					open={advancedSheetOpen}
					onOpenChange={onAdvancedSheetOpenChange}
				>
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
