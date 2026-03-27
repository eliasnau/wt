"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { InferClientOutputs } from "@orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetClose,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/utils/billing";
import { client, orpc } from "@/utils/orpc";
import {
	DEFAULT_GROUP_COLOR,
	GROUP_COLOR_PRESETS,
	getRandomGroupColor,
} from "./group-color-presets";

type GroupsList = InferClientOutputs<typeof client>["groups"]["list"];
type GroupRow = GroupsList[number];

const groupFormSchema = z.object({
	name: z.string().min(3, {
		message: "Name muss mindestens 3 Zeichen lang sein.",
	}),
	description: z.string().optional(),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
		message: "Bitte gib eine gültige Hex-Farbe ein (z. B. #000000)",
	}),
	defaultMembershipPrice: z
		.string()
		.optional()
		.refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
			message: "Bitte gib einen gültigen Preis ein (z. B. 10 oder 10.99)",
		}),
});

const priceRegex = /^\d+(\.\d{1,2})?$/;

function parsePriceValue(value: string): number | undefined {
	const normalizedValue = value.trim();
	if (!normalizedValue) {
		return undefined;
	}

	const parsed = Number(normalizedValue);
	if (Number.isNaN(parsed)) {
		return undefined;
	}

	return Math.round(parsed * 100);
}

function formatAmountInputFromCents(amountCents: number | null | undefined) {
	if (amountCents === null || amountCents === undefined) {
		return "";
	}

	return (amountCents / 100).toString();
}

function EnrollMemberDialog({
	group,
	existingMemberIds,
	open,
	onOpenChange,
	onSuccess,
}: {
	group: GroupRow;
	existingMemberIds: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
	const [membershipPrice, setMembershipPrice] = useState("");
	const [priceError, setPriceError] = useState<string | null>(null);

	const membersQueryOptions = orpc.members.list.queryOptions({
		input: {
			page: 1,
			limit: 20,
			search: search.trim() || undefined,
		},
	});

	const { data: members, isPending } = useQuery({
		...membersQueryOptions,
	});

	const availableMembers =
		members?.data.filter((member) => !existingMemberIds.includes(member.id)) ??
		[];

	const enrollMutation = useMutation({
		mutationFn: async () => {
			if (!selectedMemberId) {
				throw new Error("Bitte wähle ein Mitglied");
			}
			return client.members.assignGroup({
				memberId: selectedMemberId,
				groupId: group.id,
				membershipPriceCents: parsePriceValue(membershipPrice),
			});
		},
		onSuccess: () => {
			toast.success("Mitglied erfolgreich aufgenommen");
			queryClient.invalidateQueries({
				queryKey: orpc.members.list.queryKey({
					input: {
						page: 1,
						limit: 20,
						search: search.trim() || undefined,
					},
				}),
			});
			onSuccess?.();
			onOpenChange(false);
			setSelectedMemberId(null);
			setMembershipPrice("");
		},
		onError: (error) => {
			toast.error(error.message ?? "Mitglied konnte nicht aufgenommen werden");
		},
	});

	const handleSubmit = () => {
		if (membershipPrice && !priceRegex.test(membershipPrice)) {
			setPriceError("Ungültiges Preisformat");
			return;
		}
		setPriceError(null);
		enrollMutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Mitglied aufnehmen</DialogTitle>
					<DialogDescription>
						Füge der Gruppe "{group.name}" ein Mitglied hinzu.
					</DialogDescription>
				</DialogHeader>
				<DialogPanel className="space-y-4">
					<div className="space-y-2">
						<label className="font-medium text-sm" htmlFor="member-search">
							Mitglieder suchen
						</label>
						<Input
							id="member-search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Nach Name oder E-Mail suchen"
						/>
					</div>
					<div className="space-y-2">
						<p className="font-medium text-sm">Ein Mitglied auswählen</p>
						<div className="rounded-lg border">
							<ScrollArea className="max-h-56">
								<div className="flex flex-col p-2">
									{isPending ? (
										<div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
											Mitglieder werden geladen...
										</div>
									) : availableMembers.length === 0 ? (
										<div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
											Keine verfügbaren Mitglieder gefunden.
										</div>
									) : (
										availableMembers.map((member) => (
											<button
												key={member.id}
												type="button"
												onClick={() => setSelectedMemberId(member.id)}
												className={`flex flex-col rounded-md px-3 py-2 text-left transition-colors ${
													selectedMemberId === member.id
														? "bg-muted text-foreground"
														: "hover:bg-muted/50"
												}`}
											>
												<span className="font-medium text-sm">
													{member.firstName} {member.lastName}
												</span>
												<span className="text-muted-foreground text-xs">
													{member.email || "—"}
												</span>
											</button>
										))
									)}
								</div>
							</ScrollArea>
						</div>
					</div>
					<div className="space-y-1">
						<label className="font-medium text-sm" htmlFor="membership-price">
							Individueller Monatsbeitrag (optional)
						</label>
						<Input
							id="membership-price"
							value={membershipPrice}
							onChange={(event) => setMembershipPrice(event.target.value)}
							placeholder={
								group.defaultMembershipPriceCents !== null &&
								group.defaultMembershipPriceCents !== undefined
									? `Standard: ${(group.defaultMembershipPriceCents / 100).toFixed(2)}`
									: "Leer lassen, um den Standard zu verwenden"
							}
						/>
						{group.defaultMembershipPriceCents !== null &&
							group.defaultMembershipPriceCents !== undefined && (
							<p className="text-muted-foreground text-xs">
								Standardbeitrag: {formatCents(group.defaultMembershipPriceCents)}
							</p>
						)}
						{priceError && (
							<p className="text-destructive text-xs">{priceError}</p>
						)}
					</div>
				</DialogPanel>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Abbrechen
					</DialogClose>
					<Button
						onClick={handleSubmit}
						disabled={enrollMutation.isPending || !selectedMemberId}
					>
						{enrollMutation.isPending
							? "Wird aufgenommen..."
							: "Mitglied aufnehmen"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function EditGroupSheet({
	group,
	open,
	onOpenChange,
	onSuccess,
}: {
	group: GroupRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const form = useForm<z.infer<typeof groupFormSchema>>({
		resolver: zodResolver(groupFormSchema),
		defaultValues: {
			name: group?.name ?? "",
			description: group?.description ?? "",
			color: group?.color ?? DEFAULT_GROUP_COLOR,
			defaultMembershipPrice: formatAmountInputFromCents(
				group?.defaultMembershipPriceCents,
			),
		},
	});

	const updateGroupMutation = useMutation({
		mutationFn: async (data: {
			id: string;
			name?: string;
			description?: string;
			color: string;
			defaultMembershipPriceCents?: number;
		}) => client.groups.update(data),
		onSuccess: () => {
			toast.success("Gruppe erfolgreich aktualisiert");
			onSuccess?.();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message ?? "Gruppe konnte nicht aktualisiert werden");
		},
	});

	const handleSubmit = (values: z.infer<typeof groupFormSchema>) => {
		if (!group) return;
		updateGroupMutation.mutate({
			id: group.id,
			name: values.name.trim(),
			description: values.description?.trim() ?? "",
			color: values.color.toLowerCase(),
			defaultMembershipPriceCents: parsePriceValue(
				values.defaultMembershipPrice ?? "",
			),
		});
	};

	useEffect(() => {
		if (!open || !group) return;

		form.reset({
			name: group.name ?? "",
			description: group.description ?? "",
			color: group.color ?? DEFAULT_GROUP_COLOR,
			defaultMembershipPrice: formatAmountInputFromCents(
				group.defaultMembershipPriceCents,
			),
		});
	}, [open, group, form]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetPopup inset>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex h-full flex-col"
					>
						<SheetHeader>
							<SheetTitle>Gruppe bearbeiten</SheetTitle>
							<SheetDescription>
								Aktualisiere den Gruppennamen und den Standardbeitrag.
							</SheetDescription>
						</SheetHeader>
						<SheetPanel className="grid flex-1 gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name *</FormLabel>
										<FormControl>
											<Input
												placeholder="Kids"
												type="text"
												{...field}
												disabled={updateGroupMutation.isPending}
												required
											/>
										</FormControl>
										<FormDescription>
											Das ist der Anzeigename der Gruppe.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Beschreibung</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Beschreibung der Gruppe (optional)"
												rows={3}
												{...field}
												disabled={updateGroupMutation.isPending}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="color"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center justify-between gap-2">
											<FormLabel>Farbe *</FormLabel>
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() =>
													field.onChange(getRandomGroupColor(field.value))
												}
												disabled={updateGroupMutation.isPending}
											>
												Zufällig
											</Button>
										</div>
										<FormControl>
											<div className="space-y-3">
												<div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
													{GROUP_COLOR_PRESETS.map((preset) => {
														const isSelected =
															field.value?.toLowerCase() === preset.hex;

														return (
															<button
																key={preset.hex}
																type="button"
																onClick={() => field.onChange(preset.hex)}
																disabled={updateGroupMutation.isPending}
																className={`h-8 w-8 rounded-md border transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring ${
																	isSelected
																		? "ring-2 ring-foreground ring-offset-2"
																		: ""
																}`}
																style={{ backgroundColor: preset.hex }}
																title={preset.name}
																aria-label={`${preset.name} auswählen`}
															/>
														);
													})}
												</div>
												<div className="flex items-center gap-3">
													<Input
														type="color"
														value={field.value}
														onChange={field.onChange}
														disabled={updateGroupMutation.isPending}
														className="h-10 w-14 p-1"
														required
													/>
													<Input
														type="text"
														value={field.value}
														onChange={field.onChange}
														placeholder={DEFAULT_GROUP_COLOR}
														disabled={updateGroupMutation.isPending}
														pattern="^#[0-9A-Fa-f]{6}$"
														required
													/>
												</div>
											</div>
										</FormControl>
										<FormDescription>
											Wähle eine Farbe oder gib einen Hex-Wert ein.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="defaultMembershipPrice"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Standard-Mitgliedsbeitrag</FormLabel>
										<FormControl>
											<InputGroup>
												<InputGroupInput
													placeholder={
														group?.defaultMembershipPriceCents !== null &&
														group?.defaultMembershipPriceCents !== undefined
															? `Aktuell: ${(group.defaultMembershipPriceCents / 100).toFixed(2)}`
															: "0.00"
													}
													type="text"
													{...field}
													disabled={updateGroupMutation.isPending}
													pattern="^[0-9]+(\\.[0-9]{1,2})?$"
												/>
												<InputGroupAddon align="inline-end">
													<InputGroupText>€</InputGroupText>
												</InputGroupAddon>
											</InputGroup>
										</FormControl>
										<FormDescription>
											Leer lassen, um den aktuellen Preis beizubehalten.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</SheetPanel>
						<SheetFooter>
							<SheetClose
								render={<Button variant="ghost" />}
								disabled={updateGroupMutation.isPending}
							>
								Abbrechen
							</SheetClose>
							<Button type="submit" disabled={updateGroupMutation.isPending}>
								{updateGroupMutation.isPending ? (
									<>
										<Spinner />
										Wird gespeichert...
									</>
								) : (
									"Änderungen speichern"
								)}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetPopup>
		</Sheet>
	);
}

export function GroupMembersSheet({
	group,
	open,
	onOpenChange,
}: {
	group: GroupRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [enrollOpen, setEnrollOpen] = useState(false);
	const limit = 10;

	const membersQueryOptions = orpc.members.list.queryOptions({
		input: {
			page,
			limit,
			search: search.trim() || undefined,
			groupIds: group ? [group.id] : undefined,
		},
	});

	const { data, isPending, error, refetch } = useQuery({
		...membersQueryOptions,
		enabled: !!group && open,
	});

	const members = data?.data ?? [];
	const totalPages = data?.pagination.totalPages ?? 1;
	const existingMemberIds = members.map((member) => member.id);

	const handleOpenChange = (nextOpen: boolean) => {
		onOpenChange(nextOpen);
		if (nextOpen) {
			setSearch("");
			setPage(1);
		}
	};

	if (!group) return null;

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetPopup inset>
				<SheetHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1">
							<SheetTitle>{group.name} Mitglieder</SheetTitle>
							<SheetDescription>
								Zeige und verwalte Mitglieder in dieser Gruppe.
							</SheetDescription>
						</div>
						<Button size="sm" onClick={() => setEnrollOpen(true)}>
							Mitglied aufnehmen
						</Button>
					</div>
				</SheetHeader>
				<SheetPanel className="flex flex-1 flex-col gap-4">
					<InputGroup className="max-w-sm">
						<InputGroupAddon>
							<SearchIcon className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							type="text"
							placeholder="Mitglieder suchen..."
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
						{search.trim() !== "" && (
							<InputGroupAddon
								align={"inline-end"}
								className="cursor-pointer"
								onClick={() => setSearch("")}
							>
								<XIcon className="size-4" />
							</InputGroupAddon>
						)}
					</InputGroup>

					{error ? (
						<Frame>
							<FramePanel>
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<AlertCircle />
										</EmptyMedia>
										<EmptyTitle>
											Mitglieder konnten nicht geladen werden
										</EmptyTitle>
										<EmptyDescription>
											{error instanceof Error
												? error.message
												: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button onClick={() => refetch()}>Erneut versuchen</Button>
									</EmptyContent>
								</Empty>
							</FramePanel>
						</Frame>
					) : (
						<div className="flex-1 overflow-hidden rounded-lg border">
							<ScrollArea>
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead>Name</TableHead>
											<TableHead>E-Mail</TableHead>
											<TableHead>Telefon</TableHead>
											<TableHead className="text-right">Aktionen</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{isPending ? (
											Array.from({ length: 4 }).map((_, idx) => (
												<TableRow key={`member-skeleton-${idx}`}>
													{Array.from({ length: 4 }).map((__, colIdx) => (
														<TableCell key={`member-skeleton-${idx}-${colIdx}`}>
															<Skeleton className="h-5 w-full" />
														</TableCell>
													))}
												</TableRow>
											))
										) : members.length === 0 ? (
											<TableRow>
												<TableCell colSpan={4} className="h-24 text-center">
													Keine Mitglieder gefunden.
												</TableCell>
											</TableRow>
										) : (
											members.map((member) => (
												<TableRow key={member.id}>
													<TableCell>
														<div className="flex flex-col">
															<span className="font-medium text-sm">
																{member.firstName} {member.lastName}
															</span>
														</div>
													</TableCell>
													<TableCell>{member.email || "—"}</TableCell>
													<TableCell>{member.phone || "—"}</TableCell>
													<TableCell className="text-right">
														<Button
															size="sm"
															variant="outline"
															render={
																<Link href={`/dashboard/members/${member.id}`}>
																	Ansehen
																</Link>
															}
														/>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</ScrollArea>
						</div>
					)}

					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-sm">
							Seite {page} von {totalPages}
						</span>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={page <= 1}
								onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							>
								Zurück
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={page >= totalPages}
								onClick={() =>
									setPage((prev) => Math.min(totalPages, prev + 1))
								}
							>
								Weiter
							</Button>
						</div>
					</div>
				</SheetPanel>
			</SheetPopup>

			<EnrollMemberDialog
				group={group}
				existingMemberIds={existingMemberIds}
				open={enrollOpen}
				onOpenChange={setEnrollOpen}
				onSuccess={() => {
					refetch();
				}}
			/>
		</Sheet>
	);
}
