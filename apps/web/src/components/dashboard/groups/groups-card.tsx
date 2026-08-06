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
import { parseError } from "evlog";
import {
	BoxesIcon,
	EditIcon,
	Loader2Icon,
	MoreVerticalIcon,
	SearchIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { GroupRow } from "@/components/dashboard/groups/group-dialog";
import { orpc, queryClient } from "@/utils/orpc";

function formatPrice(cents: number | null) {
	if (cents == null) return "—";
	return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function GroupsCard({ onEdit }: { onEdit: (group: GroupRow) => void }) {
	const [searchInput, setSearchInput] = useState("");
	const [deleting, setDeleting] = useState<GroupRow | null>(null);

	const groupsQuery = useQuery(orpc.groups.list.queryOptions({}));

	const deleteMutation = useMutation(
		orpc.groups.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Gruppe gelöscht");
				queryClient.invalidateQueries({ queryKey: orpc.groups.key() });
				setDeleting(null);
			},
			onError: (error) => toast.error(parseError(error).message),
		}),
	);

	const allGroups = groupsQuery.data ?? [];
	const search = searchInput.trim().toLowerCase();
	const groups = search
		? allGroups.filter(
				(group) =>
					group.name.toLowerCase().includes(search) ||
					(group.description ?? "").toLowerCase().includes(search),
			)
		: allGroups;

	return (
		<div className="flex flex-col gap-4">
			<InputGroup className="max-w-xs">
				<InputGroupAddon>
					{groupsQuery.isFetching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
				</InputGroupAddon>
				<InputGroupInput
					onChange={(e) => setSearchInput(e.target.value)}
					placeholder="Gruppen suchen…"
					value={searchInput}
				/>
			</InputGroup>

			{groupsQuery.isError ? (
				<CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
					<p className="text-muted-foreground text-sm">{parseError(groupsQuery.error).message}</p>
					<Button onClick={() => groupsQuery.refetch()} size="sm" variant="outline">
						Erneut versuchen
					</Button>
				</CardFrame>
			) : (
				<CardFrame className="w-full min-w-0 overflow-hidden">
					<Table className="min-w-[640px]" variant="card">
						<TableHeader>
							<TableRow>
								<TableHead>Gruppe</TableHead>
								<TableHead>Beschreibung</TableHead>
								<TableHead>Standardbeitrag</TableHead>
								<TableHead>Erstellt</TableHead>
								<TableHead className="w-px text-right">Aktionen</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{groupsQuery.isPending ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`skeleton-${i}`}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Skeleton className="size-3 rounded-full" />
												<Skeleton className="h-4 w-28" />
											</div>
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-40" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-16" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-20" />
										</TableCell>
										<TableCell />
									</TableRow>
								))
							) : groups.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell className="p-0" colSpan={5}>
										{search ? (
											<Empty className="py-12">
												<EmptyHeader>
													<EmptyMedia variant="icon">
														<SearchIcon />
													</EmptyMedia>
													<EmptyTitle>Keine Ergebnisse</EmptyTitle>
													<EmptyDescription>
														Keine Gruppen entsprechen deiner Suche.
													</EmptyDescription>
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
														<BoxesIcon />
													</EmptyMedia>
													<EmptyTitle>Noch keine Gruppen</EmptyTitle>
													<EmptyDescription>
														Lege deine erste Gruppe an, um Mitglieder zu organisieren.
													</EmptyDescription>
												</EmptyHeader>
											</Empty>
										)}
									</TableCell>
								</TableRow>
							) : (
								groups.map((group) => (
									<TableRow key={group.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<span
													aria-hidden="true"
													className="size-3 shrink-0 rounded-full"
													style={{ backgroundColor: group.color }}
												/>
												<span className="font-medium text-foreground">{group.name}</span>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{group.description || "—"}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatPrice(group.defaultMembershipPriceCents)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{new Date(group.createdAt).toLocaleDateString("de-DE")}
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
														<MenuItem onClick={() => onEdit(group)}>
															<EditIcon />
															Bearbeiten
														</MenuItem>
														<MenuSeparator />
														<MenuItem onClick={() => setDeleting(group)} variant="destructive">
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
						<AlertDialogTitle>Gruppe löschen?</AlertDialogTitle>
						<AlertDialogDescription>
							„{deleting?.name}" wird dauerhaft entfernt. Mitglieder verlieren diese Gruppe.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
						<Button
							loading={deleteMutation.isPending}
							onClick={() => deleting && deleteMutation.mutate({ id: deleting.id })}
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
