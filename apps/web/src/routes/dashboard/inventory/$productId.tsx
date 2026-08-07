import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
} from "@matdesk/ui/components/alert-dialog";
import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import {
	Card,
	CardFrame,
	CardFrameAction,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@matdesk/ui/components/card";
import { Input } from "@matdesk/ui/components/input";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@matdesk/ui/components/table";
import { cn } from "@matdesk/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import { ArrowLeftIcon, LayoutGridIcon, ListIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductSheet } from "@/components/dashboard/inventory/product-sheet";
import { inventoryProductQueryOptions } from "@/queries/inventory";
import { client, orpc } from "@/utils/orpc";

type Product = Awaited<ReturnType<typeof client.inventory.get>>;
type Variant = Product["variants"][number];

export const Route = createFileRoute("/dashboard/inventory/$productId")({
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(inventoryProductQueryOptions(params.productId));
	},
	pendingComponent: () => <Skeleton className="h-72 rounded-2xl" />,
	component: RouteComponent,
});

function variantKey(pairs: { attr: string; value: string }[]) {
	return pairs
		.map((p) => `${p.attr}=${p.value}`)
		.sort()
		.join("|");
}

function buildLookup(variants: Variant[]) {
	const map = new Map<string, Variant>();
	for (const variant of variants) {
		map.set(
			variantKey(variant.options.map((o) => ({ attr: o.attributeName, value: o.value }))),
			variant,
		);
	}
	return map;
}

function RouteComponent() {
	const { productId } = Route.useParams();
	const productQuery = useQuery(inventoryProductQueryOptions(productId));

	return (
		<div className="flex flex-col gap-6">
			<Button
				className="-ml-2 self-start text-muted-foreground"
				render={<Link to="/dashboard/inventory" />}
				size="sm"
				variant="ghost"
			>
				<ArrowLeftIcon />
				Zurück zum Inventar
			</Button>

			{productQuery.isPending ? (
				<div className="flex flex-col gap-2">
					<Skeleton className="h-7 w-56" />
					<Skeleton className="h-4 w-40" />
				</div>
			) : productQuery.isError ? (
				<CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
					<p className="text-muted-foreground text-sm">{parseError(productQuery.error).message}</p>
					<Button onClick={() => productQuery.refetch()} size="sm" variant="outline">
						Erneut versuchen
					</Button>
				</CardFrame>
			) : (
				<ProductDetail product={productQuery.data} />
			)}
		</div>
	);
}

function ProductDetail({ product }: { product: Product }) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const matrixAvailable = product.attributes.length >= 1 && product.attributes.length <= 2;
	const [view, setView] = useState<"matrix" | "list">(matrixAvailable ? "matrix" : "list");
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const lookup = useMemo(() => buildLookup(product.variants), [product.variants]);

	const saveMutation = useMutation(
		orpc.inventory.updateVariantQuantities.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.inventory.get.key({ input: { productId: product.id } }),
				});
				void queryClient.invalidateQueries({ queryKey: orpc.inventory.list.key() });
				setDrafts({});
			},
			onError: (error) => toast.error(parseError(error).message),
		}),
	);

	const deleteMutation = useMutation(
		orpc.inventory.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Produkt gelöscht");
				queryClient.invalidateQueries({ queryKey: orpc.inventory.list.key() });
				navigate({ to: "/dashboard/inventory" });
			},
			onError: (error) => toast.error(parseError(error).message),
		}),
	);

	const pendingUpdates = product.variants
		.map((variant) => {
			const draft = drafts[variant.id];
			if (draft === undefined || draft.trim() === "") return null;
			const quantity = Math.max(0, Math.round(Number(draft)));
			if (!Number.isFinite(quantity) || quantity === variant.quantity) return null;
			return { variantId: variant.id, quantity };
		})
		.filter((u): u is { variantId: string; quantity: number } => u !== null);

	const totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0);

	function save() {
		if (pendingUpdates.length === 0) return;
		saveMutation.mutate({ productId: product.id, updates: pendingUpdates });
	}

	return (
		<>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="truncate font-semibold text-2xl tracking-tight">{product.name}</h1>
						<Badge variant={product.isActive ? "success" : "secondary"}>
							{product.isActive ? "Aktiv" : "Inaktiv"}
						</Badge>
					</div>
					<p className="mt-0.5 text-muted-foreground text-sm">
						{product.variants.length} Varianten · {totalStock} auf Lager
						{product.description ? ` · ${product.description}` : ""}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button onClick={() => setEditOpen(true)} variant="outline">
						Bearbeiten
					</Button>
					<Button onClick={() => setDeleteOpen(true)} variant="destructive-outline">
						<Trash2Icon />
						Löschen
					</Button>
				</div>
			</div>

			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Bestand</CardFrameTitle>
					<CardFrameDescription>
						Mengen je Variante. Änderungen werden gesammelt gespeichert.
					</CardFrameDescription>
					<CardFrameAction>
						<div className="flex items-center gap-2">
							{matrixAvailable ? (
								<div className="inline-flex rounded-lg border bg-card p-0.5">
									<Button
										className="gap-1.5"
										onClick={() => setView("matrix")}
										size="sm"
										variant={view === "matrix" ? "secondary" : "ghost"}
									>
										<LayoutGridIcon />
										Matrix
									</Button>
									<Button
										className="gap-1.5"
										onClick={() => setView("list")}
										size="sm"
										variant={view === "list" ? "secondary" : "ghost"}
									>
										<ListIcon />
										Liste
									</Button>
								</div>
							) : null}
							<Button
								disabled={pendingUpdates.length === 0}
								loading={saveMutation.isPending}
								onClick={save}
								size="sm"
							>
								Speichern{pendingUpdates.length > 0 ? ` (${pendingUpdates.length})` : ""}
							</Button>
						</div>
					</CardFrameAction>
				</CardFrameHeader>
				<Card>
					<CardPanel>
						{view === "matrix" && matrixAvailable ? (
							<StockMatrix drafts={drafts} lookup={lookup} product={product} setDrafts={setDrafts} />
						) : (
							<StockList drafts={drafts} product={product} setDrafts={setDrafts} />
						)}
					</CardPanel>
				</Card>
			</CardFrame>

			<ProductSheet
				onOpenChange={setEditOpen}
				open={editOpen}
				product={{
					id: product.id,
					name: product.name,
					description: product.description,
					attributes: product.attributes.map((a) => ({ name: a.name, values: a.values })),
				}}
			/>

			<AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
				<AlertDialogPopup>
					<AlertDialogHeader>
						<AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
						<AlertDialogDescription>
							„{product.name}" und alle Varianten werden dauerhaft entfernt.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
						<Button
							loading={deleteMutation.isPending}
							onClick={() => deleteMutation.mutate({ productId: product.id })}
							variant="destructive"
						>
							Löschen
						</Button>
					</AlertDialogFooter>
				</AlertDialogPopup>
			</AlertDialog>
		</>
	);
}

function QtyInput({
	variant,
	drafts,
	setDrafts,
}: {
	variant: Variant;
	drafts: Record<string, string>;
	setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
	const value = drafts[variant.id] ?? String(variant.quantity);
	const changed = drafts[variant.id] !== undefined && Number(value) !== variant.quantity;
	return (
		<Input
			className={cn(
				"h-9 w-20 text-center tabular-nums",
				changed && "border-primary ring-1 ring-primary",
			)}
			inputMode="numeric"
			min="0"
			onChange={(e) => setDrafts((prev) => ({ ...prev, [variant.id]: e.target.value }))}
			type="number"
			value={value}
		/>
	);
}

function StockMatrix({
	product,
	lookup,
	drafts,
	setDrafts,
}: {
	product: Product;
	lookup: Map<string, Variant>;
	drafts: Record<string, string>;
	setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
	const [rowAttr, colAttr] = product.attributes;
	if (!rowAttr) return null;

	// One attribute → a single column matrix.
	const colValues = colAttr ? colAttr.values : ["Bestand"];

	return (
		<div className="overflow-x-auto rounded-xl border bg-background">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="border-b">
						<th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground text-xs">
							<span className="text-foreground">{rowAttr.name}</span>
							{colAttr ? (
								<>
									<span className="px-1">/</span>
									<span className="text-foreground">{colAttr.name}</span>
								</>
							) : null}
						</th>
						{colValues.map((colValue) => (
							<th
								className="bg-muted/40 px-2 py-2 text-center font-medium text-foreground text-xs"
								key={colValue}
							>
								{colValue}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rowAttr.values.map((rowValue) => (
						<tr className="border-t" key={rowValue}>
							<th
								className="sticky left-0 z-10 whitespace-nowrap bg-muted/40 px-3 py-1.5 text-left font-medium text-foreground text-xs"
								scope="row"
							>
								{rowValue}
							</th>
							{colValues.map((colValue) => {
								const pairs = colAttr
									? [
											{ attr: rowAttr.name, value: rowValue },
											{ attr: colAttr.name, value: colValue },
										]
									: [{ attr: rowAttr.name, value: rowValue }];
								const variant = lookup.get(variantKey(pairs));
								return (
									<td className="border-l px-1.5 py-1.5 text-center" key={colValue}>
										{variant ? (
											<QtyInput drafts={drafts} setDrafts={setDrafts} variant={variant} />
										) : (
											<span className="text-muted-foreground text-xs">—</span>
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function StockList({
	product,
	drafts,
	setDrafts,
}: {
	product: Product;
	drafts: Record<string, string>;
	setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Variante</TableHead>
					<TableHead className="w-28 text-right">Bestand</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{product.variants.map((variant) => (
					<TableRow key={variant.id}>
						<TableCell className="font-medium text-foreground">
							{variant.options.length > 0
								? variant.options.map((o) => o.value).join(" / ")
								: "Standard"}
						</TableCell>
						<TableCell className="text-right">
							<div className="flex justify-end">
								<QtyInput drafts={drafts} setDrafts={setDrafts} variant={variant} />
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
