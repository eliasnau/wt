"use client";

import { ORPCError } from "@orpc/client";
import type { ListMembersAdvancedInput } from "@repo/api/routers/members/listMembersAdvanced";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import {
	AlertCircle,
	CalendarIcon,
	PlusIcon,
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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { MembersV2Controls } from "./_components/members-v2-controls";
import {
	MembersV2PrintListSheet,
} from "./_components/members-v2-print-list-sheet";
import { MembersV2Table } from "./_components/members-v2-table";
import { useMembersV2PrintList } from "./_components/use-members-v2-print-list";

type MembersV2PageClientProps = {
	canExportMembers: boolean;
};

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

type SavedMembersViewState = {
	search: string;
	groupIds: string[];
	includeActive: boolean;
	includeCancelled: boolean;
	includeCancelledButActive: boolean;
	sortField: SortField;
	sortDirection: SortDirection;
	filterMode: "and" | "or";
	filters: QueryFilter[];
	limit: number;
};

type SavedMembersView = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	state: SavedMembersViewState;
};

type SystemMembersView = {
	id: string;
	name: string;
	description: string;
	state: SavedMembersViewState;
};

const FILTER_FIELDS: Array<{ label: string; value: FilterField }> = [
	{ label: "Vorname", value: "firstName" },
	{ label: "Nachname", value: "lastName" },
	{ label: "Geburtsdatum", value: "birthdate" },
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
	{ label: "Gruppenanzahl", value: "groupCount" },
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
	"birthdate",
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

const NUMERIC_FILTER_FIELDS = new Set<FilterField>(["groupCount"]);

const NUMERIC_FILTER_OPERATORS: Array<{
	label: string;
	value: FilterOperator;
}> = [
	{ label: "gleich", value: "eq" },
	{ label: "ungleich", value: "neq" },
	{ label: "größer/gleich", value: "gte" },
	{ label: "kleiner/gleich", value: "lte" },
];

const SORT_FIELDS: Array<{ label: string; value: SortField }> = [
	{ label: "Erstellt", value: "createdAt" },
	{ label: "Aktualisiert", value: "updatedAt" },
	{ label: "Vorname", value: "firstName" },
	{ label: "Nachname", value: "lastName" },
	{ label: "Geburtsdatum", value: "birthdate" },
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
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NON_NEGATIVE_INTEGER_REGEX = /^\d+$/;
const FILTER_FIELD_VALUES = new Set<FilterField>(
	FILTER_FIELDS.map((option) => option.value),
);
const SORT_FIELD_VALUES = new Set<SortField>(
	SORT_FIELDS.map((option) => option.value),
);
const SORT_DIRECTION_VALUES = new Set<SortDirection>(
	SORT_DIRECTIONS.map((option) => option.value),
);
const SAVED_VIEWS_STORAGE_KEY = "members-v2:saved-views:v1";
const DEFAULT_VIEW_STATE: SavedMembersViewState = {
	search: "",
	groupIds: [],
	includeActive: true,
	includeCancelled: false,
	includeCancelledButActive: true,
	sortField: "startDate",
	sortDirection: "desc",
	filterMode: "and",
	filters: [],
	limit: 20,
};
const SYSTEM_MEMBERS_VIEWS: SystemMembersView[] = [
	{
		id: "system-all-members-include-cancelled",
		name: "All members (include cancelled)",
		description:
			"Shows active, cancelled, and cancelled-but-still-active members.",
		state: {
			...DEFAULT_VIEW_STATE,
			includeCancelled: true,
		},
	},
	{
		id: "system-members-missing-contact-info",
		name: "Members without contact info",
		description: "Shows members missing an email address or phone number.",
		state: {
			...DEFAULT_VIEW_STATE,
			filterMode: "or",
			filters: [
				{
					field: "email",
					operator: "isNull",
				},
				{
					field: "phone",
					operator: "isNull",
				},
			],
		},
	},
];

function createLocalId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function isDateField(field: FilterField): boolean {
	return DATE_FILTER_FIELDS.has(field);
}

function isNumericField(field: FilterField): boolean {
	return NUMERIC_FILTER_FIELDS.has(field);
}

function getOperatorsForField(
	field: FilterField,
): Array<{ label: string; value: FilterOperator }> {
	if (isDateField(field)) {
		return DATE_FILTER_OPERATORS;
	}

	if (isNumericField(field)) {
		return NUMERIC_FILTER_OPERATORS;
	}

	return FILTER_OPERATORS;
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
		id: createLocalId(),
		field: "fullName",
		operator: "contains",
		value: "",
	};
}

function queryFilterToBuilderRow(filter: QueryFilter): QueryBuilderRow {
	if (!("value" in filter)) {
		return {
			id: createLocalId(),
			field: filter.field,
			operator: filter.operator,
			value: "",
		};
	}

	if (Array.isArray(filter.value)) {
		return {
			id: createLocalId(),
			field: filter.field,
			operator: "in",
			value: filter.value.join(", "),
		};
	}

	return {
		id: createLocalId(),
		field: filter.field,
		operator: filter.operator,
		value: filter.value,
	};
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function sanitizeFilter(raw: unknown): QueryFilter | null {
	if (!isObject(raw)) return null;
	const rawField = raw.field;
	const rawOperator = raw.operator;
	const allowedOperators = getOperatorsForField(rawField as FilterField).map(
		(option) => option.value,
	);

	if (
		typeof rawField !== "string" ||
		!FILTER_FIELD_VALUES.has(rawField as FilterField)
	) {
		return null;
	}

	if (
		typeof rawOperator !== "string" ||
		!allowedOperators.includes(rawOperator as FilterOperator)
	) {
		return null;
	}

	const field = rawField as FilterField;
	switch (rawOperator) {
		case "isNull":
			return { field, operator: "isNull" };
		case "isNotNull":
			return { field, operator: "isNotNull" };
		case "in": {
			if (!Array.isArray(raw.value)) return null;
			const values = raw.value
				.filter((value): value is string => typeof value === "string")
				.map((value) => value.trim())
				.filter(Boolean);
			if (values.length === 0) return null;
			return {
				field,
				operator: "in",
				value: values,
			};
		}
		case "contains":
		case "eq":
		case "neq":
		case "startsWith":
		case "endsWith":
		case "gte":
		case "lte": {
			if (typeof raw.value !== "string") {
				return null;
			}

			const value = raw.value.trim();
			if (!value) {
				return null;
			}

			if (isNumericField(field) && !NON_NEGATIVE_INTEGER_REGEX.test(value)) {
				return null;
			}

			return {
				field,
				operator: rawOperator,
				value,
			};
		}
		default:
			return null;
	}
}

function sanitizeSavedViewState(raw: unknown): SavedMembersViewState | null {
	if (!isObject(raw)) return null;

	const filters = Array.isArray(raw.filters)
		? raw.filters
				.map((filter) => sanitizeFilter(filter))
				.filter((filter): filter is QueryFilter => filter !== null)
		: [];

	const groupIds = Array.isArray(raw.groupIds)
		? raw.groupIds
				.filter((groupId): groupId is string => typeof groupId === "string")
				.map((groupId) => groupId.trim())
				.filter((groupId) => groupId.length > 0 && UUID_REGEX.test(groupId))
		: [];

	const sortField =
		typeof raw.sortField === "string" &&
		SORT_FIELD_VALUES.has(raw.sortField as SortField)
			? (raw.sortField as SortField)
			: "startDate";

	const sortDirection =
		typeof raw.sortDirection === "string" &&
		SORT_DIRECTION_VALUES.has(raw.sortDirection as SortDirection)
			? (raw.sortDirection as SortDirection)
			: "desc";

	const limit =
		typeof raw.limit === "number" &&
		Number.isInteger(raw.limit) &&
		raw.limit >= 1 &&
		raw.limit <= 100
			? raw.limit
			: 20;

	return {
		search: typeof raw.search === "string" ? raw.search : "",
		groupIds,
		includeActive:
			typeof raw.includeActive === "boolean" ? raw.includeActive : true,
		includeCancelled:
			typeof raw.includeCancelled === "boolean" ? raw.includeCancelled : false,
		includeCancelledButActive:
			typeof raw.includeCancelledButActive === "boolean"
				? raw.includeCancelledButActive
				: true,
		sortField,
		sortDirection,
		filterMode: raw.filterMode === "or" ? "or" : "and",
		filters,
		limit,
	};
}

function sanitizeSavedViewsPayload(raw: unknown): SavedMembersView[] {
	if (!Array.isArray(raw)) return [];

	return raw
		.map((entry): SavedMembersView | null => {
			if (!isObject(entry)) return null;
			const state = sanitizeSavedViewState(entry.state);
			if (!state) return null;
			if (typeof entry.id !== "string" || entry.id.trim().length === 0) {
				return null;
			}
			if (typeof entry.name !== "string" || entry.name.trim().length === 0) {
				return null;
			}

			const nowIso = new Date().toISOString();

			return {
				id: entry.id,
				name: entry.name.trim(),
				createdAt:
					typeof entry.createdAt === "string" ? entry.createdAt : nowIso,
				updatedAt:
					typeof entry.updatedAt === "string" ? entry.updatedAt : nowIso,
				state,
			};
		})
		.filter((entry): entry is SavedMembersView => entry !== null);
}

function normalizeFilterValue(value: string | string[]) {
	if (Array.isArray(value)) {
		return [...value].sort((left, right) => left.localeCompare(right, "de"));
	}

	return value;
}

function getCanonicalViewState(state: SavedMembersViewState) {
	return {
		...state,
		groupIds: [...state.groupIds].sort((left, right) =>
			left.localeCompare(right, "de"),
		),
		filters: [...state.filters]
			.map((filter) =>
				"value" in filter
					? {
							...filter,
							value: normalizeFilterValue(filter.value),
						}
					: filter,
			)
			.sort((left, right) => {
				const leftKey = JSON.stringify(left);
				const rightKey = JSON.stringify(right);
				return leftKey.localeCompare(rightKey, "de");
			}),
	};
}

function areViewStatesEqual(
	left: SavedMembersViewState,
	right: SavedMembersViewState,
): boolean {
	return (
		JSON.stringify(getCanonicalViewState(left)) ===
		JSON.stringify(getCanonicalViewState(right))
	);
}

function toCompiledFilter(row: QueryBuilderRow): QueryFilter | null {
	switch (row.operator) {
		case "isNull":
			return {
				field: row.field,
				operator: "isNull",
			};
		case "isNotNull":
			return {
				field: row.field,
				operator: "isNotNull",
			};
		case "in": {
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
		case "contains":
		case "eq":
		case "neq":
		case "startsWith":
		case "endsWith":
		case "gte":
		case "lte": {
			const trimmed = row.value.trim();
			if (!trimmed) {
				return null;
			}

			if (
				isNumericField(row.field) &&
				!NON_NEGATIVE_INTEGER_REGEX.test(trimmed)
			) {
				return null;
			}

			return {
				field: row.field,
				operator: row.operator,
				value: trimmed,
			};
		}
		default:
			return null;
	}
}

export function MembersV2PageClient({
	canExportMembers,
}: MembersV2PageClientProps) {
	const [
		{
			page,
			limit,
			search,
			groupIds,
			memberIds,
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
		memberIds: parseAsArrayOf(parseAsString).withDefault([]),
		includeActive: parseAsBoolean.withDefault(true),
		includeCancelled: parseAsBoolean.withDefault(false),
		includeCancelledButActive: parseAsBoolean.withDefault(true),
		sortField: parseAsString.withDefault("startDate"),
		sortDirection: parseAsString.withDefault("desc"),
	});

	const [filters, setFilters] = useState<QueryBuilderRow[]>([]);
	const [filterMode, setFilterMode] = useState<"and" | "or">("and");
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [advancedSheetOpen, setAdvancedSheetOpen] = useState(false);
	const [printSheetOpen, setPrintSheetOpen] = useState(false);
	const [localSearch, setLocalSearch] = useState(search);
	const [savedViews, setSavedViews] = useState<SavedMembersView[]>(() => {
		if (typeof window === "undefined") {
			return [];
		}

		try {
			const raw = window.localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
			if (!raw) return [];
			const parsed = JSON.parse(raw) as unknown;
			return sanitizeSavedViewsPayload(parsed);
		} catch {
			return [];
		}
	});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const debouncedSetSearch = useDebounce((nextSearch: string) => {
		setQueryState({ page: 1, search: nextSearch });
	}, 300);

	const validGroupIds =
		groupIds.length > 0
			? groupIds.filter(
					(id) => id && id.trim().length > 0 && UUID_REGEX.test(id),
				)
			: [];
	const validMemberIds =
		memberIds.length > 0
			? memberIds.filter(
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
		memberIds: validMemberIds.length > 0 ? validMemberIds : undefined,
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

	const exportInput = {
		search: search || undefined,
		groupIds: validGroupIds.length > 0 ? validGroupIds : undefined,
		memberIds: validMemberIds.length > 0 ? validMemberIds : undefined,
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
	const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
		const visibleMemberIds = new Set(
			(data?.data ?? []).map((member) => member.id),
		);

		setRowSelection((current) => {
			const nextVisibleSelection =
				typeof updater === "function" ? updater(current) : updater;
			const mergedSelection: RowSelectionState = { ...current };

			for (const memberId of visibleMemberIds) {
				delete mergedSelection[memberId];
			}

			for (const [memberId, isSelected] of Object.entries(
				nextVisibleSelection,
			)) {
				if (visibleMemberIds.has(memberId) && isSelected) {
					mergedSelection[memberId] = true;
				}
			}

			return mergedSelection;
		});
	};

	const { data: groupsData } = useQuery(
		orpc.groups.list.queryOptions({
			input: {},
		}),
	);
	const groupFilterOptions = useMemo(
		() =>
			(groupsData ?? []).map((group) => ({
				label: group.name,
				value: group.id,
			})),
		[groupsData],
	);

	const exportCsvMutation = useMutation(
		orpc.members.exportCsv.mutationOptions({
			onSuccess: ({ csv, filename, rowCount }) => {
				const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
				const downloadUrl = URL.createObjectURL(blob);
				const anchor = document.createElement("a");
				anchor.href = downloadUrl;
				anchor.download = filename;
				document.body.append(anchor);
				anchor.click();
				anchor.remove();
				URL.revokeObjectURL(downloadUrl);

				toast.success("CSV export erstellt", {
					description: `${rowCount} Zeile${rowCount === 1 ? "" : "n"} exportiert.`,
				});
			},
			onError: (mutationError) => {
				toast.error("CSV export fehlgeschlagen", {
					description:
						mutationError instanceof Error
							? mutationError.message
							: "Bitte versuche es erneut.",
				});
			},
		}),
	);

	const printListMutation = useMembersV2PrintList({
		exportInput,
		onPrintReady: () => setPrintSheetOpen(false),
	});

	const hasActiveFilters =
		Boolean(search) ||
		validGroupIds.length > 0 ||
		validMemberIds.length > 0 ||
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

	const showOnlySelectedMembers = () => {
		const selectedMemberIds = Object.entries(rowSelection)
			.filter(([, isSelected]) => Boolean(isSelected))
			.map(([memberId]) => memberId);

		if (selectedMemberIds.length === 0) {
			return;
		}

		setRowSelection({});
		setLocalSearch("");
		setFilters([]);
		setFilterMode("and");
		setAdvancedOpen(false);
		setAdvancedSheetOpen(false);
		setQueryState({
			page: 1,
			search: "",
			groupIds: [],
			memberIds: selectedMemberIds,
			includeActive: true,
			includeCancelled: true,
			includeCancelledButActive: true,
		});
	};

	const showAllMembers = () => {
		const restoredSelection = validMemberIds.reduce<RowSelectionState>(
			(acc, memberId) => {
				acc[memberId] = true;
				return acc;
			},
			{},
		);

		setRowSelection(restoredSelection);
		setQueryState({
			page: 1,
			memberIds: [],
		});
	};

	const updateFilter = (id: string, updates: Partial<QueryBuilderRow>) => {
		setFilters((current) =>
			current.map((filter) =>
				filter.id === id ? { ...filter, ...updates } : filter,
			),
		);
		setQueryState({ page: 1 });
	};

	const exportMembersCsv = () => {
		exportCsvMutation.mutate(exportInput);
	};

	const exportSelectedMembersCsv = () => {
		const memberIds = Object.entries(rowSelection)
			.filter(([, isSelected]) => Boolean(isSelected))
			.map(([memberId]) => memberId);

		if (memberIds.length === 0) {
			return;
		}

		exportCsvMutation.mutate({ memberIds });
	};

	const persistSavedViews = (nextViews: SavedMembersView[]) => {
		setSavedViews(nextViews);
		try {
			window.localStorage.setItem(
				SAVED_VIEWS_STORAGE_KEY,
				JSON.stringify(nextViews),
			);
		} catch {
			// Ignore storage write errors (private mode / quota / blocked storage).
		}
	};

	const buildCurrentViewState = (): SavedMembersViewState => ({
		search: search || "",
		groupIds: validGroupIds,
		includeActive,
		includeCancelled,
		includeCancelledButActive,
		sortField: safeSortField,
		sortDirection: safeSortDirection,
		filterMode,
		filters: compiledFilters,
		limit,
	});
	const currentViewState = buildCurrentViewState();
	const matchedSystemView = useMemo(
		() =>
			SYSTEM_MEMBERS_VIEWS.find((entry) =>
				areViewStatesEqual(entry.state, currentViewState),
			) ?? null,
		[currentViewState],
	);
	const matchedSavedView = useMemo(
		() =>
			savedViews.find((entry) =>
				areViewStatesEqual(entry.state, currentViewState),
			) ?? null,
		[savedViews, currentViewState],
	);
	const selectedSystemViewId = matchedSystemView?.id ?? "";
	const selectedSavedViewId = matchedSavedView?.id ?? "";
	const canSaveView =
		!areViewStatesEqual(currentViewState, DEFAULT_VIEW_STATE) &&
		!matchedSystemView &&
		!matchedSavedView;

	const saveAsNewView = () => {
		const suggestedName = `Ansicht ${savedViews.length + 1}`;
		const enteredName = window.prompt("Name für Ansicht", suggestedName);

		if (enteredName === null) {
			return;
		}

		const name = enteredName.trim() || suggestedName;
		const existingViewWithSameState = savedViews.find((entry) =>
			areViewStatesEqual(entry.state, currentViewState),
		);
		if (existingViewWithSameState) {
			toast.error("Ansicht bereits vorhanden", {
				description: `"${existingViewWithSameState.name}" hat bereits diese Filter.`,
			});
			return;
		}

		const now = new Date().toISOString();
		const newView: SavedMembersView = {
			id: createLocalId(),
			name,
			createdAt: now,
			updatedAt: now,
			state: currentViewState,
		};

		const nextViews = [newView, ...savedViews];
		persistSavedViews(nextViews);

		toast.success("Ansicht gespeichert", {
			description: `"${name}" wurde gespeichert.`,
		});
	};

	const requestSaveView = () => {
		saveAsNewView();
	};

	const renameSelectedView = () => {
		if (!matchedSavedView) {
			toast.error("Keine Ansicht ausgewählt");
			return;
		}

		const enteredName = window.prompt(
			"Ansicht umbenennen",
			matchedSavedView.name,
		);
		if (enteredName === null) {
			return;
		}

		const name = enteredName.trim() || matchedSavedView.name;
		if (name === matchedSavedView.name) {
			return;
		}

		const duplicateName = savedViews.find(
			(entry) =>
				entry.id !== matchedSavedView.id &&
				entry.name.localeCompare(name, "de", { sensitivity: "base" }) === 0,
		);
		if (duplicateName) {
			toast.error("Name bereits vergeben", {
				description: `"${duplicateName.name}" existiert bereits.`,
			});
			return;
		}

		const now = new Date().toISOString();
		const nextViews = savedViews.map((entry) =>
			entry.id === matchedSavedView.id
				? {
						...entry,
						name,
						updatedAt: now,
					}
				: entry,
		);

		persistSavedViews(nextViews);
		toast.success("Ansicht umbenannt", {
			description: `"${matchedSavedView.name}" heißt jetzt "${name}".`,
		});
	};

	const applyViewState = ({
		name,
		state,
	}: {
		name: string;
		state: SavedMembersViewState;
	}) => {
		const nextFilters = state.filters.map(queryFilterToBuilderRow);
		setLocalSearch(state.search);
		setFilters(nextFilters);
		setFilterMode(state.filterMode);
		setQueryState({
			page: 1,
			limit: state.limit,
			search: state.search,
			groupIds: state.groupIds,
			memberIds: [],
			includeActive: state.includeActive,
			includeCancelled: state.includeCancelled,
			includeCancelledButActive: state.includeCancelledButActive,
			sortField: state.sortField,
			sortDirection: state.sortDirection,
		});

		toast.success("Ansicht angewendet", {
			description: `"${name}" wurde geladen.`,
		});
	};

	const applySystemView = (view: SystemMembersView) => {
		applyViewState({
			name: view.name,
			state: view.state,
		});
	};

	const deleteSelectedView = () => {
		const view = matchedSavedView;
		if (!view) {
			toast.error("Keine Ansicht ausgewählt");
			return;
		}

		const nextViews = savedViews.filter((entry) => entry.id !== view.id);
		persistSavedViews(nextViews);

		toast.success("Ansicht gelöscht", {
			description: `"${view.name}" wurde entfernt.`,
		});
	};

	const advancedFiltersPanel = (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<span className="font-medium text-sm">Advanced Query</span>
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
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectPopup>
				</Select>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setFilters((current) => [...current, createFilterRow()]);
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
					Keine zusätzlichen Bedingungen. Füge eine Bedingung hinzu, z. B.
					<code>email contains @gmail.com</code> oder
					<code>city eq Berlin</code>.
				</p>
			) : (
				<div className="space-y-2">
					{filters.map((filter) => {
						const availableOperators = getOperatorsForField(filter.field);
						const dateField = isDateField(filter.field);
						const selectedDate = dateField
							? parseDateFilterValue(filter.value)
							: undefined;
						const requiresValue = !NULL_OPERATORS.has(filter.operator);
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
										const nextOperators = getOperatorsForField(nextField);
										const nextOperator =
											nextOperators.find(
												(operator) => operator.value === filter.operator,
											)?.value ??
											nextOperators[0]?.value ??
											"eq";

										updateFilter(filter.id, {
											field: nextField,
											operator: nextOperator,
											value: isDateField(nextField) ? "" : filter.value,
										});
									}}
								>
									<SelectTrigger size="sm">
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										{FILTER_FIELDS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
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
											value: NULL_OPERATORS.has(value as FilterOperator)
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
											<SelectItem key={option.value} value={option.value}>
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
											<PopoverPopup align="start" className="w-auto p-0">
												<Calendar
													mode="single"
													captionLayout="dropdown"
													selected={selectedDate}
													onSelect={(date) =>
														updateFilter(filter.id, {
															value: date ? formatDateFilterValue(date) : "",
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
												type={isNumericField(filter.field) ? "number" : "text"}
												inputMode={
													isNumericField(filter.field) ? "numeric" : undefined
												}
												min={isNumericField(filter.field) ? 0 : undefined}
												step={isNumericField(filter.field) ? 1 : undefined}
												placeholder={
													isNumericField(filter.field)
														? "0 = keine Gruppe, 1 = genau eine Gruppe"
														: inMode
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
											current.filter((row) => row.id !== filter.id),
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
	);

	return (
		<div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
			<Header>
				<HeaderContent>
					<HeaderTitle>Mitglieder</HeaderTitle>
					<HeaderDescription />
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
					<MembersV2Controls
						localSearch={localSearch}
						onSearchChange={(next) => {
							setLocalSearch(next);
							debouncedSetSearch(next);
						}}
						onClearSearch={() => {
							setLocalSearch("");
							setQueryState({ page: 1, search: "" });
						}}
						groupOptions={groupFilterOptions}
						groupIds={groupIds}
						onGroupIdsChange={(nextGroupIds) => {
							setQueryState({ page: 1, groupIds: nextGroupIds });
						}}
						showSelectedOnly={validMemberIds.length > 0}
						onShowAllMembers={showAllMembers}
						sortFieldOptions={SORT_FIELDS}
						sortDirectionOptions={SORT_DIRECTIONS}
						sortField={safeSortField}
						sortDirection={safeSortDirection}
						onSortFieldChange={(value) => {
							setQueryState({ page: 1, sortField: value });
						}}
						onSortDirectionChange={(value) => {
							setQueryState({ page: 1, sortDirection: value });
						}}
						canExportCsv={canExportMembers}
						onExportCsv={exportMembersCsv}
						exportPending={exportCsvMutation.isPending}
						onOpenPrintSheet={() => setPrintSheetOpen(true)}
						onOpenAdvancedSheet={() => setAdvancedSheetOpen(true)}
						onToggleAdvancedDesktop={() => setAdvancedOpen((open) => !open)}
						advancedFilterCount={compiledFilters.length}
						systemViews={SYSTEM_MEMBERS_VIEWS}
						savedViews={savedViews}
						canSaveView={canSaveView}
						selectedSystemViewId={selectedSystemViewId}
						selectedSavedViewId={selectedSavedViewId}
						onApplySystemView={(id) => {
							const view = SYSTEM_MEMBERS_VIEWS.find((v) => v.id === id);
							if (view) applySystemView(view);
						}}
						onApplySavedView={(id) => {
							const view = savedViews.find((v) => v.id === id);
							if (!view) return;
							applyViewState({
								name: view.name,
								state: view.state,
							});
						}}
						onSaveView={requestSaveView}
						onRenameView={renameSelectedView}
						onDeleteSavedView={deleteSelectedView}
						includeActive={includeActive}
						includeCancelled={includeCancelled}
						includeCancelledButActive={includeCancelledButActive}
						onIncludeActiveChange={(checked) =>
							setQueryState({
								page: 1,
								includeActive: checked,
							})
						}
						onIncludeCancelledChange={(checked) =>
							setQueryState({
								page: 1,
								includeCancelled: checked,
							})
						}
						onIncludeCancelledButActiveChange={(checked) =>
							setQueryState({
								page: 1,
								includeCancelledButActive: checked,
							})
						}
						hasActiveFilters={hasActiveFilters}
						onResetAllFilters={resetAllFilters}
						advancedOpen={advancedOpen}
						onAdvancedOpenChange={setAdvancedOpen}
						advancedSheetOpen={advancedSheetOpen}
						onAdvancedSheetOpenChange={setAdvancedSheetOpen}
						advancedFiltersPanel={advancedFiltersPanel}
					/>

					<MembersV2PrintListSheet
						open={printSheetOpen}
						onOpenChange={setPrintSheetOpen}
						onPrintList={(options) => printListMutation.mutate(options)}
						printPending={printListMutation.isPending}
					/>

					<div className="min-w-0 max-w-full">
						<MembersV2Table
							canExportCsv={canExportMembers}
							data={data?.data ?? []}
							rowSelection={rowSelection}
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
							onClearSelection={() => setRowSelection({})}
							onExportCsv={exportSelectedMembersCsv}
							onShowOnlySelected={showOnlySelectedMembers}
							onRowSelectionChange={handleRowSelectionChange}
							onPageChange={(nextPage) => setQueryState({ page: nextPage })}
							onLimitChange={(nextLimit) =>
								setQueryState({ page: 1, limit: nextLimit })
							}
							exportPending={exportCsvMutation.isPending}
							loading={isPending}
						/>
					</div>
				</>
			)}
		</div>
	);
}
