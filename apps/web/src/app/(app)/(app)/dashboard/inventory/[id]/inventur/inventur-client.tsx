"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Check, Printer, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	CelebrateButton,
	type CelebrateButtonHandle,
} from "@/components/ui/celebration";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";
import {
	applySortMode,
	getTotalStock,
	type Product,
	SORT_OPTIONS,
	type SortMode,
	sortVariants,
} from "../../_components/types";

type Variant = Product["variants"][number];

const NO_GROUPING = "__none__";
const MAX_QUANTITY = 999_999;

export function InventurClient() {
	const params = useParams();
	const productId = params.id as string;

	const { data, isPending, error, refetch } = useQuery(
		orpc.inventory.getProduct.queryOptions({ input: { productId } }),
	);

	if (isPending) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 h-9 w-40 motion-safe:animate-in motion-safe:duration-500" />
				<Skeleton className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 h-10 w-72 motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:delay-100 motion-safe:duration-500" />
				<Skeleton className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 h-96 rounded-xl motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:delay-200 motion-safe:duration-500" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col gap-6">
				<Button
					variant="ghost"
					className="gap-2 self-start"
					render={<Link href={`/dashboard/inventory/${productId}`} />}
				>
					<ArrowLeft className="size-4" />
					Zurück
				</Button>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<AlertCircle />
						</EmptyMedia>
						<EmptyTitle>Produkt konnte nicht geladen werden</EmptyTitle>
						<EmptyDescription>
							{error instanceof Error
								? error.message
								: "Etwas ist schiefgelaufen."}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button onClick={() => refetch()}>Erneut versuchen</Button>
					</EmptyContent>
				</Empty>
			</div>
		);
	}

	return <Inventur product={data as Product} />;
}

function Inventur({ product }: { product: Product }) {
	const queryClient = useQueryClient();
	const celebrateRef = useRef<CelebrateButtonHandle>(null);

	// --- Options ---
	const [filters, setFilters] = useState<Record<string, Set<string>>>({});
	const [groupBy, setGroupBy] = useState<string>(NO_GROUPING);
	const [sortMode, setSortMode] = useState<SortMode>("default");
	const [hideSoll, setHideSoll] = useState(false); // Blind zählen
	const [showNotes, setShowNotes] = useState(false);

	// --- Counts state (Istbestand input per variant) ---
	// Empty string means not yet entered.
	const [counts, setCounts] = useState<Record<string, string>>({});

	// --- Sort + filter ---
	const sorted = useMemo(
		() => sortVariants(product.variants, product.attributes),
		[product.variants, product.attributes],
	);

	const filtered = useMemo(() => {
		const active = Object.entries(filters).filter(([, set]) => set.size > 0);
		if (active.length === 0) return sorted;
		return sorted.filter((variant) =>
			active.every(([attrName, set]) => {
				const opt = variant.options.find((o) => o.attributeName === attrName);
				return opt ? set.has(opt.value) : false;
			}),
		);
	}, [sorted, filters]);

	function toggleValue(attrName: string, value: string) {
		setFilters((prev) => {
			const next = { ...prev };
			const set = new Set(next[attrName] ?? []);
			if (set.has(value)) set.delete(value);
			else set.add(value);
			next[attrName] = set;
			return next;
		});
	}

	const hasAnyFilter = Object.values(filters).some((s) => s.size > 0);

	const groupItems = useMemo(
		() => [
			{ value: NO_GROUPING, label: "Keine" },
			...product.attributes.map((attr) => ({
				value: attr.name,
				label: attr.name,
			})),
		],
		[product.attributes],
	);

	const groups = useMemo(() => {
		if (groupBy === NO_GROUPING) {
			return [
				{
					key: "__all__",
					label: null,
					variants: applySortMode(filtered, sortMode),
				},
			];
		}
		const groupAttr = product.attributes.find((a) => a.name === groupBy);
		if (!groupAttr) {
			return [
				{
					key: "__all__",
					label: null,
					variants: applySortMode(filtered, sortMode),
				},
			];
		}
		const grouped = new Map<string, Variant[]>();
		for (const variant of filtered) {
			const opt = variant.options.find(
				(o) => o.attributeName === groupAttr.name,
			);
			const key = opt?.value ?? "—";
			const list = grouped.get(key) ?? [];
			list.push(variant);
			grouped.set(key, list);
		}
		return groupAttr.values
			.filter((v) => grouped.has(v))
			.map((value) => ({
				key: value,
				label: { attribute: groupAttr.name, value },
				variants: applySortMode(grouped.get(value) ?? [], sortMode),
			}));
	}, [filtered, groupBy, sortMode, product.attributes]);

	// --- Pending changes (Erfassung) ---
	const pendingChanges = useMemo(() => {
		const changes: Array<{ variantId: string; quantity: number }> = [];
		for (const variant of product.variants) {
			const raw = counts[variant.id];
			if (raw === undefined || raw === "") continue;
			const parsed = Number.parseInt(raw, 10);
			if (Number.isNaN(parsed) || parsed < 0 || parsed > MAX_QUANTITY) {
				continue;
			}
			if (parsed === variant.quantity) continue;
			changes.push({ variantId: variant.id, quantity: parsed });
		}
		return changes;
	}, [counts, product.variants]);

	const invalidCount = useMemo(() => {
		let total = 0;
		for (const raw of Object.values(counts)) {
			if (raw === "") continue;
			const parsed = Number.parseInt(raw, 10);
			if (Number.isNaN(parsed) || parsed < 0 || parsed > MAX_QUANTITY) {
				total += 1;
			}
		}
		return total;
	}, [counts]);

	const saveMutation = useMutation({
		mutationFn: async (
			changes: Array<{ variantId: string; quantity: number }>,
		) => {
			return client.inventory.updateVariantQuantities({
				productId: product.id,
				updates: changes,
			});
		},
		onSuccess: ({ updated }) => {
			queryClient.invalidateQueries({
				queryKey: orpc.inventory.getProduct.queryKey({
					input: { productId: product.id },
				}),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.inventory.listProducts.key(),
			});
			celebrateRef.current?.celebrate();
			toast.success(
				`${updated.length} ${
					updated.length === 1 ? "Bestand" : "Bestände"
				} aktualisiert`,
				{ description: "Deine Inventur ist gespeichert." },
			);
			setCounts({});
		},
		onError: (err) => {
			toast.error(err.message || "Speichern fehlgeschlagen");
		},
	});

	const totalSoll = useMemo(() => getTotalStock(product), [product]);
	const filteredSoll = useMemo(
		() => filtered.reduce((s, v) => s + v.quantity, 0),
		[filtered],
	);

	const today = useMemo(
		() =>
			new Date().toLocaleDateString("de-DE", {
				day: "2-digit",
				month: "long",
				year: "numeric",
			}),
		[],
	);

	const showAttrColumns = product.attributes.length > 0;

	return (
		<div className="flex flex-col gap-6">
			{/* Toolbar — hidden on print */}
			<div className="no-print flex flex-col gap-4">
				<Button
					variant="ghost"
					className="gap-2 self-start"
					render={<Link href={`/dashboard/inventory/${product.id}`} />}
				>
					<ArrowLeft className="size-4" />
					Zurück zum Produkt
				</Button>

				<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-1">
						<h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
							Inventur
						</h1>
						<p className="text-muted-foreground text-sm">
							Drucke eine Zählliste oder erfasse die gezählten Bestände direkt
							hier.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => window.print()}
							disabled={filtered.length === 0}
						>
							<Printer className="size-4" />
							Drucken
						</Button>
						<CelebrateButton
							ref={celebrateRef}
							tier="minor"
							size="sm"
							onClick={() => saveMutation.mutate(pendingChanges)}
							disabled={
								pendingChanges.length === 0 ||
								invalidCount > 0 ||
								saveMutation.isPending
							}
						>
							{saveMutation.isPending ? (
								<Spinner />
							) : (
								<Save className="size-4" />
							)}
							{invalidCount > 0
								? `${invalidCount} ungültig`
								: pendingChanges.length > 0
									? `Speichern (${pendingChanges.length})`
									: "Speichern"}
						</CelebrateButton>
					</div>
				</div>

				{/* Options */}
				<div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3">
					{product.attributes.length > 0 && (
						<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex-1 space-y-1.5">
								{product.attributes.map((attr) => {
									const selected = filters[attr.name] ?? new Set<string>();
									return (
										<div
											key={attr.id}
											className="flex flex-wrap items-center gap-1.5"
										>
											<span className="me-1 min-w-14 font-medium text-muted-foreground text-xs">
												{attr.name}
											</span>
											{attr.values.map((value) => {
												const isSelected = selected.has(value);
												return (
													<button
														key={value}
														type="button"
														aria-pressed={isSelected}
														onClick={() => toggleValue(attr.name, value)}
														className={cn(
															"inline-flex h-7 cursor-pointer select-none items-center rounded-full border px-3 text-xs transition-colors",
															isSelected
																? "border-primary/40 bg-primary/10 font-medium text-primary"
																: "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
														)}
													>
														{value}
													</button>
												);
											})}
										</div>
									);
								})}
							</div>
							<div className="flex flex-col items-end gap-2">
								{hasAnyFilter && (
									<button
										type="button"
										onClick={() => setFilters({})}
										className="whitespace-nowrap text-muted-foreground text-xs underline-offset-2 hover:text-foreground hover:underline"
									>
										Zurücksetzen
									</button>
								)}
								<div className="flex items-center gap-2">
									<span className="w-20 whitespace-nowrap text-muted-foreground text-xs">
										Gruppieren
									</span>
									<Select
										items={groupItems}
										value={groupBy}
										onValueChange={(value) => setGroupBy(value ?? NO_GROUPING)}
									>
										<SelectTrigger
											aria-label="Varianten gruppieren"
											size="sm"
											className="h-8 min-w-32"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{groupItems.map((item) => (
												<SelectItem key={item.value} value={item.value}>
													{item.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center gap-2">
									<span className="w-20 whitespace-nowrap text-muted-foreground text-xs">
										Sortieren
									</span>
									<Select
										items={SORT_OPTIONS}
										value={sortMode}
										onValueChange={(value) =>
											setSortMode((value as SortMode | null) ?? "default")
										}
									>
										<SelectTrigger
											aria-label="Varianten sortieren"
											size="sm"
											className="h-8 min-w-32"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{SORT_OPTIONS.map((item) => (
												<SelectItem key={item.value} value={item.value}>
													{item.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					)}

					<div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3">
						<div className="flex items-center gap-2 text-sm">
							<Switch
								aria-label="Blind zählen"
								checked={hideSoll}
								onCheckedChange={(v) => setHideSoll(Boolean(v))}
								size="sm"
							/>
							<span>Blind zählen</span>
							<span className="text-muted-foreground text-xs">
								Sollbestand verbergen
							</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<Switch
								aria-label="Notizen-Spalte"
								checked={showNotes}
								onCheckedChange={(v) => setShowNotes(Boolean(v))}
								size="sm"
							/>
							<span>Notizen-Spalte</span>
						</div>
					</div>
				</div>
			</div>

			{/* Print area */}
			<div id="print-area" className="flex flex-col gap-4">
				{/* Print header */}
				<div className="flex flex-col gap-3 print:gap-2">
					<div className="flex items-baseline justify-between gap-4">
						<h2 className="font-heading text-xl tracking-tight print:text-2xl">
							Inventur — {product.name}
						</h2>
						<span className="text-muted-foreground text-xs print:text-black">
							{today}
						</span>
					</div>
					<dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4 print:text-[11px]">
						<div>
							<dt className="text-muted-foreground print:text-black/70">
								Varianten
							</dt>
							<dd className="font-semibold tabular-nums">{filtered.length}</dd>
						</div>
						{!hideSoll && (
							<>
								<div>
									<dt className="text-muted-foreground print:text-black/70">
										Sollbestand (Auswahl)
									</dt>
									<dd className="font-semibold tabular-nums">{filteredSoll}</dd>
								</div>
								<div>
									<dt className="text-muted-foreground print:text-black/70">
										Sollbestand (gesamt)
									</dt>
									<dd className="font-semibold tabular-nums">{totalSoll}</dd>
								</div>
							</>
						)}
						<div>
							<dt className="text-muted-foreground print:text-black/70">
								Gezählt von
							</dt>
							<dd className="border-foreground/30 border-b text-transparent print:border-black/60">
								_
							</dd>
						</div>
					</dl>
				</div>

				{filtered.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>Keine Varianten</EmptyTitle>
							<EmptyDescription>
								{hasAnyFilter
									? "Keine Variante passt zu den ausgewählten Filtern."
									: "Dieses Produkt hat keine Varianten."}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<div className="overflow-hidden rounded-xl border bg-background print:rounded-none print:border-black">
						<table className="w-full border-collapse text-sm print:text-[12px]">
							<thead>
								<tr className="border-b bg-muted/40 print:bg-transparent">
									{showAttrColumns ? (
										product.attributes.map((attr) => (
											<th
												key={attr.id}
												className="px-3 py-2 text-left font-medium text-foreground text-xs print:text-black"
											>
												{attr.name}
											</th>
										))
									) : (
										<th className="px-3 py-2 text-left font-medium text-foreground text-xs print:text-black">
											Variante
										</th>
									)}
									{!hideSoll && (
										<th className="w-24 border-l px-3 py-2 text-center font-medium text-foreground text-xs print:text-black">
											Soll
										</th>
									)}
									<th className="w-32 border-l px-3 py-2 text-center font-medium text-foreground text-xs print:text-black">
										Ist
									</th>
									{!hideSoll && (
										<th className="no-print w-24 border-l px-3 py-2 text-center font-medium text-foreground text-xs">
											Δ
										</th>
									)}
									{showNotes && (
										<th className="border-l px-3 py-2 text-left font-medium text-foreground text-xs print:text-black">
											Notizen
										</th>
									)}
								</tr>
							</thead>
							<tbody>
								{groups.flatMap((group, groupIdx) => {
									const rows: React.ReactNode[] = [];
									const colCount =
										(showAttrColumns ? product.attributes.length : 1) +
										(hideSoll ? 1 : 3) +
										(showNotes ? 1 : 0);
									if (group.label) {
										rows.push(
											<tr
												key={`g-${group.key}`}
												className={cn(
													"bg-muted/30 print:bg-transparent",
													groupIdx > 0 && "border-t",
												)}
											>
												<td
													colSpan={colCount}
													className="px-3 py-1.5 text-xs print:border-black/40 print:border-t print:border-b"
												>
													<span className="font-medium text-muted-foreground print:text-black/70">
														{group.label.attribute}
													</span>
													<span className="ml-2 font-semibold print:text-black">
														{group.label.value}
													</span>
													<span className="ml-3 text-muted-foreground/70 text-xs print:text-black/60">
														({group.variants.length})
													</span>
												</td>
											</tr>,
										);
									}
									for (const variant of group.variants) {
										const raw = counts[variant.id] ?? "";
										const parsed = Number.parseInt(raw, 10);
										const hasValue =
											raw !== "" && !Number.isNaN(parsed) && parsed >= 0;
										const isInvalid =
											raw !== "" &&
											(Number.isNaN(parsed) ||
												parsed < 0 ||
												parsed > MAX_QUANTITY);
										const diff = hasValue ? parsed - variant.quantity : 0;
										rows.push(
											<tr
												key={variant.id}
												className="border-t print:border-black/30"
											>
												{showAttrColumns ? (
													product.attributes.map((attr) => {
														const opt = variant.options.find(
															(o) => o.attributeName === attr.name,
														);
														return (
															<td
																key={attr.id}
																className="px-3 py-2 align-middle"
															>
																{opt?.value ?? "—"}
															</td>
														);
													})
												) : (
													<td className="px-3 py-2 align-middle text-muted-foreground italic print:text-black">
														Standard
													</td>
												)}
												{!hideSoll && (
													<td className="border-l px-3 py-2 text-center font-semibold tabular-nums print:border-black/30">
														{variant.quantity}
													</td>
												)}
												<td className="border-l px-2 py-1 align-middle print:border-black/30">
													<Input
														type="number"
														inputMode="numeric"
														min={0}
														max={MAX_QUANTITY}
														value={raw}
														placeholder=""
														onChange={(e) =>
															setCounts((prev) => ({
																...prev,
																[variant.id]: e.target.value,
															}))
														}
														onFocus={(e) => e.currentTarget.select()}
														className={cn(
															"h-8 text-center font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
															"print:h-9 print:rounded-none print:border-black/60 print:bg-transparent print:shadow-none",
															isInvalid &&
																"border-destructive text-destructive focus-visible:ring-destructive/30",
														)}
													/>
												</td>
												{!hideSoll && (
													<td
														className={cn(
															"no-print border-l px-3 py-2 text-center font-semibold tabular-nums",
															!hasValue && "text-muted-foreground/50",
															hasValue && diff > 0 && "text-emerald-600",
															hasValue && diff < 0 && "text-red-600",
														)}
													>
														{hasValue ? (
															<span className="inline-flex items-center gap-1">
																{diff === 0 ? (
																	<Check className="size-3.5 text-muted-foreground" />
																) : (
																	(diff > 0 ? "+" : "") + diff
																)}
															</span>
														) : (
															"—"
														)}
													</td>
												)}
												{showNotes && (
													<td className="border-l px-2 py-1 align-middle print:border-black/30">
														<Input
															type="text"
															placeholder=""
															className="h-8 print:h-9 print:rounded-none print:border-black/60 print:bg-transparent print:shadow-none"
														/>
													</td>
												)}
											</tr>,
										);
									}
									return rows;
								})}
							</tbody>
						</table>
					</div>
				)}

				{/* Print footer — signature lines */}
				<div className="hidden print:mt-8 print:grid print:grid-cols-2 print:gap-12 print:text-[11px]">
					<div>
						<div className="border-black/60 border-b pb-6" />
						<div className="mt-1 text-black/70">Datum, Unterschrift Zähler</div>
					</div>
					<div>
						<div className="border-black/60 border-b pb-6" />
						<div className="mt-1 text-black/70">
							Datum, Unterschrift Kontrolle
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
