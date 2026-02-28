"use client";

import { ORPCError } from "@orpc/client";
import type { ListMembersAdvancedInput } from "@repo/api/routers/members/listMembersAdvanced";
import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	CalendarIcon,
	MoreVerticalIcon,
	PlusIcon,
	SearchIcon,
	SlidersHorizontalIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import {
	parseAsArrayOf,
	parseAsBoolean,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from "nuqs";
import { useMemo, useRef, useState } from "react";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../_components/page-header";
import { CreateMemberButton } from "../members/_components/create-member-button";
import { MembersV2Table } from "./_components/members-v2-table";

type QueryFilter = NonNullable<ListMembersAdvancedInput["filters"]>[number];
type FilterField = QueryFilter["field"];
type FilterOperator = QueryFilter["operator"];
type SortField = NonNullable<
	NonNullable<ListMembersAdvancedInput["sort"]>["field"]
>;
type SortDirection = NonNullable<
	NonNullable<ListMembersAdvancedInput["sort"]>["direction"]
>;

type QueryBuilderRow = {
	id: string;
	field: FilterField;
	operator: FilterOperator;
	value: string;
};

const FILTER_FIELDS: Array<{ label: string; value: FilterField }> = [
	{ label: "Vorname", value: "firstName" },
	{ label: "Nachname", value: "lastName" },
	{ label: "Voller Name", value: "fullName" },
	{ label: "E-Mail", value: "email" },
	{ label: "Telefon", value: "phone" },
	{ label: "Straße", value: "street" },
	{ label: "Stadt", value: "city" },
	{ label: "Bundesland", value: "state" },
	{ label: "Postleitzahl", value: "postalCode" },
	{ label: "Land", value: "country" },
	{ label: "Notizen", value: "notes" },
	{ label: "Erziehungsberechtigte (Name)", value: "guardianName" },
	{ label: "Erziehungsberechtigte (E-Mail)", value: "guardianEmail" },
	{ label: "Erziehungsberechtigte (Telefon)", value: "guardianPhone" },
	{ label: "Vertragsperiode", value: "initialPeriod" },
	{ label: "Kündigungsgrund", value: "cancelReason" },
	{ label: "Startdatum", value: "startDate" },
	{ label: "Kündigung wirksam", value: "cancellationEffectiveDate" },
	{ label: "Gekündigt am", value: "cancelledAt" },
];

const FILTER_OPERATORS: Array<{ label: string; value: FilterOperator }> = [
	{ label: "enthält", value: "contains" },
	{ label: "gleich", value: "eq" },
	{ label: "ungleich", value: "neq" },
	{ label: "beginnt mit", value: "startsWith" },
	{ label: "endet mit", value: "endsWith" },
	{ label: "größer/gleich", value: "gte" },
	{ label: "kleiner/gleich", value: "lte" },
	{ label: "in Liste", value: "in" },
	{ label: "ist leer", value: "isNull" },
	{ label: "ist nicht leer", value: "isNotNull" },
];

const DATE_FILTER_FIELDS = new Set<FilterField>([
	"startDate",
	"cancellationEffectiveDate",
	"cancelledAt",
]);

const DATE_FILTER_OPERATORS: Array<{ label: string; value: FilterOperator }> = [
	{ label: "gleich", value: "eq" },
	{ label: "ungleich", value: "neq" },
	{ label: "nach (inkl.)", value: "gte" },
	{ label: "vor (inkl.)", value: "lte" },
	{ label: "ist leer", value: "isNull" },
	{ label: "ist nicht leer", value: "isNotNull" },
];

const SORT_FIELDS: Array<{ label: string; value: SortField }> = [
	{ label: "Erstellt", value: "createdAt" },
	{ label: "Aktualisiert", value: "updatedAt" },
	{ label: "Vorname", value: "firstName" },
	{ label: "Nachname", value: "lastName" },
	{ label: "Voller Name", value: "fullName" },
	{ label: "E-Mail", value: "email" },
	{ label: "Stadt", value: "city" },
	{ label: "Vertragsstart", value: "startDate" },
	{ label: "Kündigung wirksam", value: "cancellationEffectiveDate" },
	{ label: "Gekündigt am", value: "cancelledAt" },
];

const SORT_DIRECTIONS: Array<{ label: string; value: SortDirection }> = [
	{ label: "Absteigend", value: "desc" },
	{ label: "Aufsteigend", value: "asc" },
];

const FILTER_MODE_OPTIONS: Array<{ label: string; value: "and" | "or" }> = [
	{ label: "Alle Bedingungen", value: "and" },
	{ label: "Mindestens eine Bedingung", value: "or" },
];

const NULL_OPERATORS = new Set<FilterOperator>(["isNull", "isNotNull"]);

function isDateField(field: FilterField): boolean {
	return DATE_FILTER_FIELDS.has(field);
}

function getOperatorsForField(
	field: FilterField,
): Array<{ label: string; value: FilterOperator }> {
	return isDateField(field) ? DATE_FILTER_OPERATORS : FILTER_OPERATORS;
}

function parseDateFilterValue(value: string): Date | undefined {
	if (!value) return undefined;

	const [year, month, day] = value.split("-").map((part) => Number(part));
	if (!year || !month || !day) return undefined;

	const parsed = new Date(year, month - 1, day);
	if (Number.isNaN(parsed.getTime())) return undefined;

	// Guard against invalid rollover dates like 2026-02-31
	if (
		parsed.getFullYear() !== year ||
		parsed.getMonth() !== month - 1 ||
		parsed.getDate() !== day
	) {
		return undefined;
	}

	return parsed;
}

function formatDateFilterValue(date: Date): string {
	const year = String(date.getFullYear()).padStart(4, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function createFilterRow(): QueryBuilderRow {
	return {
		id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
		field: "fullName",
		operator: "contains",
		value: "",
	};
}

function toCompiledFilter(row: QueryBuilderRow): QueryFilter | null {
	if (NULL_OPERATORS.has(row.operator)) {
		return {
			field: row.field,
			operator: row.operator,
		};
	}

	if (row.operator === "in") {
		const values = row.value
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean);

		if (values.length === 0) {
			return null;
		}

		return {
			field: row.field,
			operator: "in",
			value: values,
		};
	}

	const trimmed = row.value.trim();
	if (!trimmed) {
		return null;
	}

	return {
		field: row.field,
		operator: row.operator,
		value: trimmed,
	};
}

export function MembersV2PageClient() {
	const [
		{
			page,
			limit,
			search,
			groupIds,
			includeActive,
			includeCancelled,
			includeCancelledButActive,
			sortField,
			sortDirection,
		},
		setQueryState,
	] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		limit: parseAsInteger.withDefault(20),
		search: parseAsString.withDefault(""),
		groupIds: parseAsArrayOf(parseAsString).withDefault([]),
		includeActive: parseAsBoolean.withDefault(true),
		includeCancelled: parseAsBoolean.withDefault(false),
		includeCancelledButActive: parseAsBoolean.withDefault(true),
		sortField: parseAsString.withDefault("startDate"),
		sortDirection: parseAsString.withDefault("desc"),
	});

	const [filters, setFilters] = useState<QueryBuilderRow[]>([]);
	const [filterMode, setFilterMode] = useState<"and" | "or">("and");
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [localSearch, setLocalSearch] = useState(search);

	const prevSearchRef = useRef(search);
	if (prevSearchRef.current !== search) {
		prevSearchRef.current = search;
		setLocalSearch(search);
	}

	const debouncedSetSearch = useDebounce((nextSearch: string) => {
		setQueryState({ page: 1, search: nextSearch });
	}, 300);

	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	const validGroupIds =
		groupIds.length > 0
			? groupIds.filter(
					(id) => id && id.trim().length > 0 && UUID_REGEX.test(id),
				)
			: [];

	const compiledFilters = useMemo(
		() =>
			filters
				.map(toCompiledFilter)
				.filter((filter): filter is QueryFilter => filter !== null),
		[filters],
	);

	const safeSortField = SORT_FIELDS.some((option) => option.value === sortField)
		? (sortField as SortField)
		: "startDate";

	const safeSortDirection = SORT_DIRECTIONS.some(
		(option) => option.value === sortDirection,
	)
		? (sortDirection as SortDirection)
		: "desc";

	const queryInput: ListMembersAdvancedInput = {
		page,
		limit,
		search: search || undefined,
		groupIds: validGroupIds.length > 0 ? validGroupIds : undefined,
		status: {
			includeActive,
			includeCancelled,
			includeCancelledButActive,
		},
		sort: {
			field: safeSortField,
			direction: safeSortDirection,
		},
		filterMode: compiledFilters.length > 0 ? filterMode : undefined,
		filters: compiledFilters.length > 0 ? compiledFilters : undefined,
	};

	const { data, isPending, error, refetch } = useQuery(
		orpc.members.query.queryOptions({
			input: queryInput,
		}),
	);

	const { data: groupsData } = useQuery(
		orpc.groups.list.queryOptions({
			input: {},
		}),
	);

	const hasActiveFilters =
		Boolean(search) ||
		validGroupIds.length > 0 ||
		!includeActive ||
		includeCancelled ||
		!includeCancelledButActive ||
		compiledFilters.length > 0 ||
		safeSortField !== "startDate" ||
		safeSortDirection !== "desc";

	const isNoPermissionError =
		Boolean(error) && error instanceof ORPCError && error.code === "FORBIDDEN";

	const resetSimpleFilters = () => {
		setLocalSearch("");
		setQueryState({
			page: 1,
			search: "",
			groupIds: [],
			includeActive: true,
			includeCancelled: false,
			includeCancelledButActive: true,
			sortField: "startDate",
			sortDirection: "desc",
		});
	};

	const resetAllFilters = () => {
		resetSimpleFilters();
		setFilters([]);
		setFilterMode("and");
	};

	const updateFilter = (id: string, updates: Partial<QueryBuilderRow>) => {
		setFilters((current) =>
			current.map((filter) =>
				filter.id === id ? { ...filter, ...updates } : filter,
			),
		);
		setQueryState({ page: 1 });
	};

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Mitglieder v2</HeaderTitle>
					<HeaderDescription>
						Schnelle Filter und ein erweiterter Query Builder auf Basis von
						<code>members.query</code>.
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<CreateMemberButton />
				</HeaderActions>
			</Header>

			{error ? (
				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>
									{isNoPermissionError
										? "Kein Zugriff auf Mitglieder"
										: "Mitglieder konnten nicht geladen werden"}
								</EmptyTitle>
								<EmptyDescription>
									{isNoPermissionError
										? "Du hast nicht die nötigen Berechtigungen, um Mitglieder anzusehen."
										: error instanceof Error
											? error.message
											: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								{isNoPermissionError ? (
									<Button onClick={() => window.history.back()}>Zurück</Button>
								) : (
									<Button onClick={() => refetch()}>Erneut versuchen</Button>
								)}
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
				<>
					<div className="space-y-4">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<InputGroup className="w-[420px] max-w-[44vw]">
									<InputGroupAddon>
										<SearchIcon className="size-4" />
									</InputGroupAddon>
									<InputGroupInput
										type="text"
										placeholder="Suche über Name, E-Mail, Telefon, Adresse, Vertragsfelder..."
										value={localSearch}
										onChange={(event) => {
											const next = event.target.value;
											setLocalSearch(next);
											debouncedSetSearch(next);
										}}
									/>
									{localSearch !== "" && (
										<InputGroupAddon
											align="inline-end"
											className="cursor-pointer"
											onClick={() => {
												setLocalSearch("");
												setQueryState({ page: 1, search: "" });
											}}
										>
											<XIcon className="size-4" />
										</InputGroupAddon>
									)}
								</InputGroup>

								<DataTableFacetedFilter
									title="Gruppen"
									options={(groupsData ?? []).map((group) => ({
										label: group.name,
										value: group.id,
									}))}
									selectedValues={groupIds}
									buttonSize="default"
									onValueChange={(nextGroupIds) => {
										setQueryState({ page: 1, groupIds: nextGroupIds });
									}}
								/>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setAdvancedOpen((open) => !open)}
								>
									<SlidersHorizontalIcon />
									Advanced Builder
									{compiledFilters.length > 0
										? ` (${compiledFilters.length})`
										: ""}
								</Button>

								<Menu>
									<MenuTrigger
										render={
											<Button size="icon" variant="outline">
												<MoreVerticalIcon />
											</Button>
										}
									/>
									<MenuPopup align="end" className="w-[280px]">
										<MenuCheckboxItem
											variant="switch"
											checked={includeActive}
											onCheckedChange={(checked) =>
												setQueryState({
													page: 1,
													includeActive: Boolean(checked),
												})
											}
										>
											Aktive Mitglieder
										</MenuCheckboxItem>
										<MenuCheckboxItem
											variant="switch"
											checked={includeCancelled}
											onCheckedChange={(checked) =>
												setQueryState({
													page: 1,
													includeCancelled: Boolean(checked),
												})
											}
										>
											Gekündigte Mitglieder
										</MenuCheckboxItem>
										<MenuCheckboxItem
											variant="switch"
											checked={includeCancelledButActive}
											onCheckedChange={(checked) =>
												setQueryState({
													page: 1,
													includeCancelledButActive: Boolean(checked),
												})
											}
										>
											Gekündigt, noch aktiv
										</MenuCheckboxItem>
									</MenuPopup>
								</Menu>
							</div>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-sm">
									Sortierung
								</span>
								<Select
									items={SORT_FIELDS}
									value={safeSortField}
									onValueChange={(value) => {
										setQueryState({ page: 1, sortField: value });
									}}
								>
									<SelectTrigger size="sm" className="min-w-44">
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										{SORT_FIELDS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectPopup>
								</Select>
								<Select
									items={SORT_DIRECTIONS}
									value={safeSortDirection}
									onValueChange={(value) => {
										setQueryState({ page: 1, sortDirection: value });
									}}
								>
									<SelectTrigger size="sm" className="min-w-36">
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										{SORT_DIRECTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectPopup>
								</Select>
							</div>
							<div className="flex items-center gap-2">
								{hasActiveFilters && (
									<Button variant="ghost" size="sm" onClick={resetAllFilters}>
										<XIcon />
										Alles zurücksetzen
									</Button>
								)}
							</div>
						</div>

						<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
							<CollapsibleContent>
								<Frame>
									<FramePanel>
										<div className="space-y-3">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-medium text-sm">
													Advanced Query
												</span>
												<Select
													items={FILTER_MODE_OPTIONS}
													value={filterMode}
													onValueChange={(value) => {
														setFilterMode(value as "and" | "or");
														setQueryState({ page: 1 });
													}}
												>
													<SelectTrigger size="sm" className="min-w-36">
														<SelectValue />
													</SelectTrigger>
													<SelectPopup>
														{FILTER_MODE_OPTIONS.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectPopup>
												</Select>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setFilters((current) => [
															...current,
															createFilterRow(),
														]);
														setQueryState({ page: 1 });
													}}
												>
													<PlusIcon />
													Bedingung hinzufügen
												</Button>
												{filters.length > 0 && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setFilters([]);
															setQueryState({ page: 1 });
														}}
													>
														<XIcon />
														Advanced leeren
													</Button>
												)}
											</div>

											{filters.length === 0 ? (
												<p className="text-muted-foreground text-sm">
													Keine zusätzlichen Bedingungen. Füge eine Bedingung
													hinzu, z. B. <code>email contains @gmail.com</code>{" "}
													oder
													<code>city eq Berlin</code>.
												</p>
											) : (
												<div className="space-y-2">
													{filters.map((filter) => {
														const availableOperators = getOperatorsForField(
															filter.field,
														);
														const dateField = isDateField(filter.field);
														const selectedDate = dateField
															? parseDateFilterValue(filter.value)
															: undefined;
														const requiresValue = !NULL_OPERATORS.has(
															filter.operator,
														);
														const inMode = filter.operator === "in";

														return (
															<div
																key={filter.id}
																className="grid gap-2 rounded-lg border bg-background p-2 md:grid-cols-[minmax(180px,1fr)_minmax(150px,0.8fr)_minmax(220px,1fr)_auto]"
															>
																<Select
																	items={FILTER_FIELDS}
																	value={filter.field}
																	onValueChange={(value) => {
																		const nextField = value as FilterField;
																		const nextOperators =
																			getOperatorsForField(nextField);
																		const nextOperator =
																			nextOperators.find(
																				(operator) =>
																					operator.value === filter.operator,
																			)?.value ??
																			nextOperators[0]?.value ??
																			"eq";

																		updateFilter(filter.id, {
																			field: nextField,
																			operator: nextOperator,
																			value: isDateField(nextField)
																				? ""
																				: filter.value,
																		});
																	}}
																>
																	<SelectTrigger size="sm">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectPopup>
																		{FILTER_FIELDS.map((option) => (
																			<SelectItem
																				key={option.value}
																				value={option.value}
																			>
																				{option.label}
																			</SelectItem>
																		))}
																	</SelectPopup>
																</Select>

																<Select
																	items={availableOperators}
																	value={filter.operator}
																	onValueChange={(value) =>
																		updateFilter(filter.id, {
																			operator: value as FilterOperator,
																			value: NULL_OPERATORS.has(
																				value as FilterOperator,
																			)
																				? ""
																				: filter.value,
																		})
																	}
																>
																	<SelectTrigger size="sm">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectPopup>
																		{availableOperators.map((option) => (
																			<SelectItem
																				key={option.value}
																				value={option.value}
																			>
																				{option.label}
																			</SelectItem>
																		))}
																	</SelectPopup>
																</Select>

																{requiresValue ? (
																	dateField ? (
																		<Popover>
																			<PopoverTrigger
																				render={
																					<Button
																						variant="outline"
																						className="w-full justify-start text-left font-normal"
																					/>
																				}
																			>
																				<CalendarIcon />
																				{selectedDate ? (
																					<span>
																						{new Intl.DateTimeFormat("de-DE", {
																							dateStyle: "medium",
																						}).format(selectedDate)}
																					</span>
																				) : (
																					<span className="text-muted-foreground">
																						Datum wählen
																					</span>
																				)}
																			</PopoverTrigger>
																			<PopoverPopup
																				align="start"
																				className="w-auto p-0"
																			>
																				<Calendar
																					mode="single"
																					captionLayout="dropdown"
																					selected={selectedDate}
																					onSelect={(date) =>
																						updateFilter(filter.id, {
																							value: date
																								? formatDateFilterValue(date)
																								: "",
																						})
																					}
																					fromYear={1950}
																					toYear={new Date().getFullYear() + 20}
																				/>
																			</PopoverPopup>
																		</Popover>
																	) : (
																		<InputGroup>
																			<InputGroupInput
																				type="text"
																				placeholder={
																					inMode
																						? "Werte mit Komma trennen (z.B. Berlin,Hamburg)"
																						: "Wert eingeben"
																				}
																				value={filter.value}
																				onChange={(event) =>
																					updateFilter(filter.id, {
																						value: event.target.value,
																					})
																				}
																			/>
																		</InputGroup>
																	)
																) : (
																	<div className="flex items-center text-muted-foreground text-sm">
																		Kein Wert nötig
																	</div>
																)}

																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => {
																		setFilters((current) =>
																			current.filter(
																				(row) => row.id !== filter.id,
																			),
																		);
																		setQueryState({ page: 1 });
																	}}
																>
																	<Trash2Icon />
																</Button>
															</div>
														);
													})}
												</div>
											)}
										</div>
									</FramePanel>
								</Frame>
							</CollapsibleContent>
						</Collapsible>
					</div>

					<MembersV2Table
						data={data?.data ?? []}
						pagination={
							data?.pagination ?? {
								page,
								limit,
								totalCount: 0,
								totalPages: 0,
								hasNextPage: false,
								hasPreviousPage: false,
							}
						}
						hasActiveFilters={hasActiveFilters}
						onClearFilters={resetAllFilters}
						onPageChange={(nextPage) => setQueryState({ page: nextPage })}
						onLimitChange={(nextLimit) =>
							setQueryState({ page: 1, limit: nextLimit })
						}
						loading={isPending}
					/>
				</>
			)}
		</div>
	);
}
