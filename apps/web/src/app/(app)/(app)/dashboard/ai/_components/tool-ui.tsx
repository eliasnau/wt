"use client";

import {
	BookOpenIcon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ExternalLinkIcon,
	HashIcon,
	LayersIcon,
	LoaderCircleIcon,
	MailIcon,
	PhoneIcon,
	UserIcon,
	UsersIcon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Sheet,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
	if (!value) return "—";
	try {
		return new Date(value).toLocaleDateString("de-DE", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return value;
	}
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function InfoRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType;
	label: string;
	value: string | null | undefined;
}) {
	if (!value) return null;
	return (
		<div className="flex items-center gap-3">
			<Icon className="size-3.5 shrink-0 text-muted-foreground" />
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="ml-auto text-right font-medium text-sm">{value}</span>
		</div>
	);
}

function StatCard({
	label,
	value,
}: {
	label: string;
	value: number | undefined;
}) {
	if (value === undefined) return null;
	return (
		<div className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="font-semibold text-2xl tabular-nums">{value}</p>
		</div>
	);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberGroup = { id: string; name: string; color?: string | null };

type MemberContract = {
	startDate?: string | null;
	cancelledAt?: string | null;
	cancelReason?: string | null;
	cancellationEffectiveDate?: string | null;
};

type QueryMember = {
	id: string;
	name: string;
	email?: string | null;
	phone?: string | null;
	membershipStatus?: string | null;
	contract?: MemberContract | null;
	groups?: MemberGroup[];
};

type MemberDetail = {
	id: string;
	name: string;
	birthdate?: string | null;
	email?: string | null;
	phone?: string | null;
	createdAt?: string | null;
	notes?: string | null;
	guardian?: {
		name?: string | null;
	};
	contract?: MemberContract | null;
	groups?: Array<{ id: string; name: string; color?: string | null }>;
};

type GroupItem = {
	id: string;
	name: string;
	description?: string | null;
	color?: string | null;
	memberCount?: number;
};

type DocResult = {
	title: string;
	url: string;
	description?: string;
};

// ─── Custom sheet contents per tool ──────────────────────────────────────────

function MemberListSheet({
	members,
	total,
}: {
	members: QueryMember[];
	total: number;
}) {
	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-xs">
				{total} Mitglied{total !== 1 ? "er" : ""} gefunden
				{total > members.length ? `, ${members.length} angezeigt` : ""}
			</p>
			<div className="space-y-2">
				{members.map((m) => {
					const isCancelled = Boolean(m.contract?.cancellationEffectiveDate);
					return (
						<div
							key={m.id}
							className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5"
						>
							<Avatar className="size-8 shrink-0 text-xs">
								<AvatarFallback className="bg-primary/10 text-primary">
									{getInitials(m.name)}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-sm">{m.name}</p>
								<p className="truncate text-muted-foreground text-xs">
									{m.email ?? m.phone ?? m.membershipStatus ?? ""}
								</p>
							</div>
							{isCancelled ? (
								<Badge variant="destructive" className="shrink-0 text-xs">
									Gekündigt
								</Badge>
							) : m.groups && m.groups.length > 0 ? (
								<Badge variant="secondary" className="shrink-0 text-xs">
									{m.groups[0].name}
									{m.groups.length > 1 ? ` +${m.groups.length - 1}` : ""}
								</Badge>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function MemberDetailSheet({ member }: { member: MemberDetail }) {
	const isCancelled = Boolean(member.contract?.cancellationEffectiveDate);
	const hasGuardian = member.guardian?.name;
	const hasContactInfo =
		Boolean(member.email) ||
		Boolean(member.phone) ||
		Boolean(member.createdAt) ||
		Boolean(member.birthdate);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Avatar className="size-12 text-sm">
					<AvatarFallback className="bg-primary/10 text-primary">
						{getInitials(member.name)}
					</AvatarFallback>
				</Avatar>
				<div>
					<p className="font-semibold text-base">{member.name}</p>
					<Badge
						variant={isCancelled ? "destructive" : "secondary"}
						className="mt-1 text-xs"
					>
						{isCancelled ? "Gekündigt" : "Aktiv"}
					</Badge>
				</div>
			</div>

			{/* Contact */}
			{hasContactInfo && (
				<div className="space-y-2.5 rounded-xl border bg-card px-4 py-3">
					<InfoRow icon={MailIcon} label="E-Mail" value={member.email} />
					<InfoRow icon={PhoneIcon} label="Telefon" value={member.phone} />
					<InfoRow
						icon={CalendarIcon}
						label="Beigetreten"
						value={formatDate(member.createdAt)}
					/>
					<InfoRow
						icon={CalendarIcon}
						label="Geburtsdatum"
						value={formatDate(member.birthdate)}
					/>
				</div>
			)}

			{/* Groups */}
			{member.groups && member.groups.length > 0 && (
				<div className="space-y-2">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
						Gruppen
					</p>
					<div className="flex flex-wrap gap-1.5">
						{member.groups.map((g) => (
							<Badge key={g.id} variant="outline" className="text-xs">
								{g.name}
							</Badge>
						))}
					</div>
				</div>
			)}

			{/* Contract */}
			{member.contract && (
				<div className="space-y-2.5 rounded-xl border bg-card px-4 py-3">
					<p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
						Vertrag
					</p>
					<InfoRow
						icon={CalendarIcon}
						label="Start"
						value={formatDate(member.contract.startDate)}
					/>
					{isCancelled && (
						<InfoRow
							icon={CalendarIcon}
							label="Kündigung ab"
							value={formatDate(member.contract.cancellationEffectiveDate)}
						/>
					)}
					{member.contract.cancelReason && (
						<InfoRow
							icon={UserIcon}
							label="Grund"
							value={member.contract.cancelReason}
						/>
					)}
				</div>
			)}

			{/* Guardian */}
			{hasGuardian && (
				<div className="space-y-2.5 rounded-xl border bg-card px-4 py-3">
					<p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
						Erziehungsberechtigte/r
					</p>
					<InfoRow icon={UserIcon} label="Name" value={member.guardian?.name} />
				</div>
			)}

			{/* Notes */}
			{member.notes && (
				<div className="space-y-1.5">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
						Notizen
					</p>
					<p className="whitespace-pre-wrap text-muted-foreground text-sm">
						{member.notes}
					</p>
				</div>
			)}
		</div>
	);
}

function GroupListSheet({ groups }: { groups: GroupItem[] }) {
	return (
		<div className="space-y-2">
			<p className="mb-3 text-muted-foreground text-xs">
				{groups.length} Gruppe{groups.length !== 1 ? "n" : ""}
			</p>
			{groups.map((g) => (
				<div
					key={g.id}
					className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5"
				>
					<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
						<UsersIcon className="size-3.5" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-sm">{g.name}</p>
						{g.description && (
							<p className="truncate text-muted-foreground text-xs">
								{g.description}
							</p>
						)}
					</div>
					{g.memberCount !== undefined && (
						<span className="shrink-0 text-muted-foreground text-xs">
							{g.memberCount} Mitgl.
						</span>
					)}
				</div>
			))}
		</div>
	);
}

function NumbersSheet({
	totals,
	asOfDate,
}: {
	totals: Record<string, number>;
	asOfDate?: string;
}) {
	return (
		<div className="space-y-4">
			{asOfDate && (
				<p className="text-muted-foreground text-xs">
					Stand: {formatDate(asOfDate)}
				</p>
			)}
			<div className="grid grid-cols-2 gap-2">
				<StatCard label="Aktive Mitglieder" value={totals.totalActiveMembers} />
				<StatCard label="Gruppen gesamt" value={totals.totalGroups} />
				<StatCard label="Mitglieder gesamt" value={totals.totalMembers} />
				<StatCard
					label="Ohne Gruppe"
					value={totals.totalMembersWithoutGroups}
				/>
				<StatCard
					label="Gekündigt (noch aktiv)"
					value={totals.totalCancelledButActiveMembers}
				/>
				<StatCard label="Ausgetreten" value={totals.totalCancelledMembers} />
			</div>
		</div>
	);
}

function DocsSheet({
	results,
	docsBaseUrl,
}: {
	results: DocResult[];
	docsBaseUrl?: string;
}) {
	const base = docsBaseUrl ?? "";
	return (
		<div className="space-y-2">
			{results.map((r) => (
				<a
					key={r.url}
					href={`${base}${r.url}`}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
				>
					<BookOpenIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-sm">{r.title}</p>
						{r.description && (
							<p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
								{r.description}
							</p>
						)}
					</div>
					<ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
				</a>
			))}
		</div>
	);
}

// ─── Build sheet content from output ─────────────────────────────────────────

function buildSheetContent(
	toolName: string,
	output: Record<string, unknown>,
): ReactNode {
	if (toolName === "queryMembers") {
		const members = (output.members as QueryMember[] | undefined) ?? [];
		const total =
			(output.pagination as { total?: number } | undefined)?.total ??
			members.length;
		return <MemberListSheet members={members} total={total} />;
	}

	if (toolName === "getMemberInfo") {
		const member = output.member as MemberDetail | undefined;
		if (member) return <MemberDetailSheet member={member} />;
		return (
			<p className="text-muted-foreground text-sm">Mitglied nicht gefunden.</p>
		);
	}

	if (toolName === "listGroups") {
		const groups = (output.groups as GroupItem[] | undefined) ?? [];
		return <GroupListSheet groups={groups} />;
	}

	if (toolName === "getNumbers") {
		const totals = output.totals as Record<string, number> | undefined;
		if (!totals) return null;
		return (
			<NumbersSheet
				totals={totals}
				asOfDate={output.asOfDate as string | undefined}
			/>
		);
	}

	if (toolName === "searchDocs") {
		const results =
			((output.searchResults ?? output.results) as DocResult[] | undefined) ??
			[];
		return (
			<DocsSheet
				results={results}
				docsBaseUrl={output.docsBaseUrl as string | undefined}
			/>
		);
	}

	return null;
}

function getRequestedSensitiveFields(input: unknown) {
	const includeFields = Array.isArray(
		(input as { includeFields?: unknown } | undefined)?.includeFields,
	)
		? ((input as { includeFields: unknown[] }).includeFields as string[])
		: [];

	return includeFields.filter(
		(field) =>
			field === "birthdate" || field === "email" || field === "phone",
	);
}

function getRequestedSensitiveFieldsLabel(requestedFields: string[]) {
	const labels = requestedFields.map((field) => {
		switch (field) {
			case "birthdate":
				return "Geburtsdaten";
			case "email":
				return "E-Mail-Adressen";
			case "phone":
				return "Telefonnummern";
			default:
				return "sensible Mitgliedsdaten";
		}
	});

	if (labels.length <= 1) {
		return labels[0] ?? "sensible Mitgliedsdaten";
	}

	if (labels.length === 2) {
		return `${labels[0]} und ${labels[1]}`;
	}

	return `${labels.slice(0, -1).join(", ")} und ${labels.at(-1)}`;
}

function buildApprovedSheetContent({ input }: { input: unknown }) {
	const requestedFields = getRequestedSensitiveFields(input);

	if (requestedFields.length === 0) {
		return null;
	}

	const requestedLabel = getRequestedSensitiveFieldsLabel(requestedFields);

	return (
		<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950">
			<p className="font-medium text-sm">Freigabe erteilt</p>
			<p className="mt-1 text-sm">
				Die angeforderten {requestedLabel} wurden für diese Anfrage freigegeben
				und gelesen.
			</p>
		</div>
	);
}

function buildDeniedSheetContent({ input }: { input: unknown }) {
	const requestedFields = getRequestedSensitiveFields(input);
	const requestedLabel = getRequestedSensitiveFieldsLabel(requestedFields);

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
				<p className="font-medium text-sm">Zugriff abgelehnt</p>
				<p className="mt-1 text-sm">
					Die angeforderten {requestedLabel} wurden nicht gelesen.
				</p>
				<p className="mt-1 text-xs leading-relaxed text-amber-900">
					Die Anfrage wurde nach der Ablehnung nicht ausgeführt. Wenn die KI
					diese Daten später doch lesen soll, muss sie erneut und explizit
					freigegeben werden.
				</p>
			</div>
		</div>
	);
}

// ─── Per-tool config ──────────────────────────────────────────────────────────

type ToolConfig = {
	icon: React.ElementType;
	loadingLabel: string;
	doneLabel: (output: Record<string, unknown>) => string;
	sheetTitle: (output: Record<string, unknown>) => string;
};

const TOOL_CONFIG: Record<string, ToolConfig> = {
	queryMembers: {
		icon: UsersIcon,
		loadingLabel: "Suche Mitglieder…",
		doneLabel: (d) => {
			const total =
				(d.pagination as { totalCount?: number } | undefined)?.totalCount ??
				(d.members as unknown[] | undefined)?.length ??
				0;
			return `${total} Mitglied${total !== 1 ? "er" : ""} gefunden`;
		},
		sheetTitle: () => "Mitglieder",
	},
	getMemberInfo: {
		icon: UserIcon,
		loadingLabel: "Lade Mitglied…",
		doneLabel: (d) => {
			const member = d.member as { name?: string } | undefined;
			return d.found && member?.name ? member.name : "Mitglied nicht gefunden";
		},
		sheetTitle: (d) => {
			const member = d.member as { name?: string } | undefined;
			return member?.name ?? "Mitglied";
		},
	},
	listGroups: {
		icon: LayersIcon,
		loadingLabel: "Lese Gruppen…",
		doneLabel: (d) => {
			const count =
				typeof d.count === "number"
					? d.count
					: ((d.groups as unknown[] | undefined)?.length ?? 0);
			return `${count} Gruppe${count !== 1 ? "n" : ""} gefunden`;
		},
		sheetTitle: () => "Gruppen",
	},
	getNumbers: {
		icon: HashIcon,
		loadingLabel: "Lade Statistiken…",
		doneLabel: () => "Statistiken geladen",
		sheetTitle: () => "Vereinsstatistiken",
	},
	searchDocs: {
		icon: BookOpenIcon,
		loadingLabel: "Durchsuche Dokumentation…",
		doneLabel: (d) => {
			const count =
				((d.searchResults ?? d.results) as unknown[] | undefined)?.length ?? 0;
			return `${count} Ergebnis${count !== 1 ? "se" : ""} gefunden`;
		},
		sheetTitle: () => "Dokumentation",
	},
};

const FALLBACK_CONFIG: ToolConfig = {
	icon: WrenchIcon,
	loadingLabel: "Ausführen…",
	doneLabel: () => "Fertig",
	sheetTitle: (d) => String(d._toolName ?? "Tool"),
};

// ─── Params section (collapsible, shown in every sheet) ──────────────────────

function ParamsSection({ input }: { input: unknown }) {
	if (input === null || input === undefined) return null;

	const entries = Object.entries(input as Record<string, unknown>).filter(
		([, v]) => v !== null && v !== undefined && v !== "",
	);

	if (entries.length === 0) return null;

	return (
		<Collapsible defaultOpen={false} className="rounded-xl border bg-muted/40">
			<CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide transition-colors hover:text-foreground">
				<span>Verwendete Parameter</span>
				<ChevronDownIcon className="size-3.5 transition-transform group-data-[open]:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="divide-y border-t">
					{entries.map(([key, value]) => (
						<div key={key} className="flex items-start gap-3 px-4 py-2">
							<span className="shrink-0 pt-px font-mono text-muted-foreground text-xs">
								{key}
							</span>
							<span className="ml-auto break-all text-right text-xs">
								{typeof value === "object"
									? JSON.stringify(value)
									: String(value)}
							</span>
						</div>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

// ─── ToolCollapsible ──────────────────────────────────────────────────────────

export function ToolCollapsible({
	toolName,
	state,
	input,
	output,
	errorText,
	approval,
}: {
	toolName: string;
	state: string;
	input: unknown;
	output: unknown;
	errorText?: string | null;
	approval?: {
		id: string;
		approved?: boolean;
		reason?: string;
	};
}): ReactNode {
	const done = state === "output-available";
	const hasError = state === "output-error";
	const isDenied = state === "output-denied";
	const isAwaitingApproval = state === "approval-requested";
	const isApprovalResponded = state === "approval-responded";
	const isLoading =
		!done &&
		!hasError &&
		!isAwaitingApproval &&
		!isDenied &&
		!isApprovalResponded;
	const config = TOOL_CONFIG[toolName] ?? FALLBACK_CONFIG;
	const Icon = config.icon;

	const data =
		output && typeof output === "object"
			? (output as Record<string, unknown>)
			: {};

	let label = config.loadingLabel;

	if (done) {
		label = config.doneLabel(data);
	} else if (hasError) {
		label = "Fehler aufgetreten";
	} else if (isDenied) {
		label = "Zugriff abgelehnt";
	} else if (isAwaitingApproval) {
		label = "Warte auf Freigabe…";
	} else if (isApprovalResponded) {
		label = "Verarbeite Freigabe…";
	}

	const sheetTitle = config.sheetTitle({ ...data, _toolName: toolName });
	const canOpen = done || hasError || isDenied;
	const approvedSheetContent =
		done && approval?.approved === true
			? buildApprovedSheetContent({ input })
			: null;
	const sheetContent = done
		? buildSheetContent(toolName, data)
		: isDenied
			? buildDeniedSheetContent({ input })
			: null;

	const innerContent = (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-sm transition-colors",
				hasError
					? "text-destructive"
					: isDenied
						? "text-amber-700"
						: "text-muted-foreground",
			)}
		>
			{isLoading ? (
				<LoaderCircleIcon className="size-4 shrink-0 animate-spin" />
			) : hasError ? (
				<XCircleIcon className="size-4 shrink-0" />
			) : isDenied ? (
				<XCircleIcon className="size-4 shrink-0" />
			) : (
				<Icon className="size-4 shrink-0" />
			)}
			{isLoading ? (
				<Shimmer as="span" duration={1.5}>
					{label}
				</Shimmer>
			) : (
				<span>{label}</span>
			)}
			{canOpen && <ChevronRightIcon className="size-3.5 shrink-0 opacity-60" />}
		</span>
	);

	if (!canOpen) {
		return innerContent;
	}

	return (
		<Sheet>
			<SheetTrigger className="cursor-pointer" render={<span />}>
				{innerContent}
			</SheetTrigger>
			<SheetPopup side="right">
				<SheetHeader>
					<div className="flex items-center gap-2">
						<Icon className="size-4 text-muted-foreground" />
						<SheetTitle>{sheetTitle}</SheetTitle>
					</div>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-5">
						<ParamsSection input={input} />
						{approvedSheetContent}
						{hasError && errorText ? (
							<div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
								<p className="mb-1 font-medium text-destructive text-xs uppercase tracking-wide">
									Fehler
								</p>
								<p className="text-destructive text-sm">{errorText}</p>
							</div>
						) : (
							(sheetContent ?? (
								<p className="text-muted-foreground text-sm">
									Keine Daten verfügbar.
								</p>
							))
						)}
					</div>
				</SheetPanel>
			</SheetPopup>
		</Sheet>
	);
}
