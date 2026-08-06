"use client";

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
import { CardFrame } from "@matdesk/ui/components/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@matdesk/ui/components/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@matdesk/ui/components/input-group";
import {
	Menu,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuTrigger,
} from "@matdesk/ui/components/menu";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@matdesk/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
	Loader2Icon,
	MoreVerticalIcon,
	PackageIcon,
	SearchIcon,
	SettingsIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { client, orpc, queryClient } from "@/utils/orpc";

type ProductListItem = Awaited<ReturnType<typeof client.inventory.list>>["data"][number];

function totalStock(variants: { quantity: number }[]) {
	return variants.reduce((sum, v) => sum + v.quantity, 0);
}

export function InventoryCard() {
	const [searchInput, setSearchInput] = useState("");
	const [deleting, setDeleting] = useState<ProductListItem | null>(null);

	const productsQuery = useQuery(
		orpc.inventory.list.queryOptions({ input: { page: 1, limit: 100 } }),
	);

	const deleteMutation = useMutation(
		orpc.inventory.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Produkt gelöscht");
				queryClient.invalidateQueries({ queryKey: orpc.inventory.list.key() });
				setDeleting(null);
			},
			onError: (error) => toast.error(parseError(error).message),
		}),
	);

	const all = productsQuery.data?.data ?? [];
	const search = searchInput.trim().toLowerCase();
	const products = search
		? all.filter(
				(p) =>
					p.name.toLowerCase().includes(search) ||
					(p.description ?? "").toLowerCase().includes(search),
			)
		: all;

	return (
		<div className="flex flex-col gap-4">
			<InputGroup className="max-w-xs">
				<InputGroupAddon>
					{productsQuery.isFetching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
				</InputGroupAddon>
				<InputGroupInput
					onChange={(e) => setSearchInput(e.target.value)}
					placeholder="Produkte suchen…"
					value={searchInput}
				/>
			</InputGroup>

			{productsQuery.isError ? (
				<CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
					<p className="text-muted-foreground text-sm">{parseError(productsQuery.error).message}</p>
					<Button onClick={() => productsQuery.refetch()} size="sm" variant="outline">
						Erneut versuchen
					</Button>
				</CardFrame>
			) : (
				<CardFrame className="w-full min-w-0 overflow-hidden">
					<Table className="min-w-[680px]" variant="card">
						<TableHeader>
							<TableRow>
								<TableHead>Produkt</TableHead>
								<TableHead>Merkmale</TableHead>
								<TableHead className="text-right">Varianten</TableHead>
								<TableHead className="text-right">Bestand</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-px text-right">Aktionen</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{productsQuery.isPending ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`skeleton-${i}`}>
										<TableCell>
											<Skeleton className="h-4 w-32" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-28" />
										</TableCell>
										<TableCell>
											<Skeleton className="ml-auto h-4 w-8" />
										</TableCell>
										<TableCell>
											<Skeleton className="ml-auto h-4 w-10" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-14 rounded-full" />
										</TableCell>
										<TableCell />
									</TableRow>
								))
							) : products.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell className="p-0" colSpan={6}>
										{search ? (
											<Empty className="py-12">
												<EmptyHeader>
													<EmptyMedia variant="icon">
														<SearchIcon />
													</EmptyMedia>
													<EmptyTitle>Keine Ergebnisse</EmptyTitle>
													<EmptyDescription>Keine Produkte entsprechen deiner Suche.</EmptyDescription>
												</EmptyHeader>
												<EmptyContent>
													<Button onClick={() => setSearchInput("")} size="sm" variant="outline">
														Suche zurücksetzen
													</Button>
												</EmptyContent>
											</Empty>
										) : (
											<Empty className="py-12">
												<EmptyHeader>
													<EmptyMedia variant="icon">
														<PackageIcon />
													</EmptyMedia>
													<EmptyTitle>Noch keine Produkte</EmptyTitle>
													<EmptyDescription>
														Lege dein erstes Produkt an, um Bestände zu verwalten.
													</EmptyDescription>
												</EmptyHeader>
											</Empty>
										)}
									</TableCell>
								</TableRow>
							) : (
								products.map((product) => (
									<TableRow key={product.id}>
										<TableCell>
											<Link
												className="font-medium text-foreground hover:underline"
												params={{ productId: product.id }}
												to="/dashboard/inventory/$productId"
											>
												{product.name}
											</Link>
											{product.description ? (
												<p className="truncate text-muted-foreground text-xs">{product.description}</p>
											) : null}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{product.attributes.length > 0
												? product.attributes.map((a) => a.name).join(", ")
												: "—"}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{product.variants.length}
										</TableCell>
										<TableCell className="text-right font-medium tabular-nums">
											{totalStock(product.variants)}
										</TableCell>
										<TableCell>
											<Badge variant={product.isActive ? "success" : "secondary"}>
												{product.isActive ? "Aktiv" : "Inaktiv"}
											</Badge>
										</TableCell>
										<TableCell className="w-px">
											<div className="flex justify-end">
												<Menu>
													<MenuTrigger
														render={
															<Button aria-label="Weitere Aktionen" size="icon-sm" variant="outline">
																<MoreVerticalIcon />
															</Button>
														}
													/>
													<MenuPopup align="end">
														<MenuItem
															render={
																<Link
																	params={{ productId: product.id }}
																	to="/dashboard/inventory/$productId"
																/>
															}
														>
															<SettingsIcon />
															Bestand verwalten
														</MenuItem>
														<MenuSeparator />
														<MenuItem onClick={() => setDeleting(product)} variant="destructive">
															<Trash2Icon />
															Löschen
														</MenuItem>
													</MenuPopup>
												</Menu>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardFrame>
			)}

			<AlertDialog
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				open={Boolean(deleting)}
			>
				<AlertDialogPopup>
					<AlertDialogHeader>
						<AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
						<AlertDialogDescription>
							„{deleting?.name}" und alle Varianten werden dauerhaft entfernt.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
						<Button
							loading={deleteMutation.isPending}
							onClick={() => deleting && deleteMutation.mutate({ productId: deleting.id })}
							variant="destructive"
						>
							Löschen
						</Button>
					</AlertDialogFooter>
				</AlertDialogPopup>
			</AlertDialog>
		</div>
	);
}
