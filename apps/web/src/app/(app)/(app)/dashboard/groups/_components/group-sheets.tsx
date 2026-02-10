"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { AlertCircle, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client, orpc } from "@/utils/orpc";
import type { InferClientOutputs } from "@orpc/client";

type GroupsList = InferClientOutputs<typeof client>["groups"]["list"];
type GroupRow = GroupsList[number];

const groupFormSchema = z.object({
	name: z.string().min(3, {
		message: "Name must be at least 3 characters.",
	}),
	description: z.string().optional(),
	defaultMembershipPrice: z
		.string()
		.optional()
		.refine((val) => !val || /^\\d+(\\.\\d{1,2})?$/.test(val), {
			message: "Please enter a valid price (e.g., 10 or 10.99)",
		}),
});

const priceRegex = /^\\d+(\\.\\d{1,2})?$/;

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
				throw new Error("Please select a member");
			}
			return client.members.assignGroup({
				memberId: selectedMemberId,
				groupId: group.id,
				membershipPrice: membershipPrice.trim() || undefined,
			});
		},
		onSuccess: () => {
			toast.success("Member enrolled successfully");
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
			toast.error(error.message ?? "Failed to enroll member");
		},
	});

	const handleSubmit = () => {
		if (membershipPrice && !priceRegex.test(membershipPrice)) {
			setPriceError("Invalid price format");
			return;
		}
		setPriceError(null);
		enrollMutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Enroll Member</DialogTitle>
					<DialogDescription>
						Add a member to "{group.name}".
					</DialogDescription>
				</DialogHeader>
				<DialogPanel className="space-y-4">
					<div className="space-y-2">
						<label className="font-medium text-sm" htmlFor="member-search">
							Search Members
						</label>
						<Input
							id="member-search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search by name or email"
						/>
					</div>
					<div className="space-y-2">
						<p className="font-medium text-sm">Select a Member</p>
						<div className="rounded-lg border">
							<ScrollArea className="max-h-56">
								<div className="flex flex-col p-2">
									{isPending ? (
										<div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
											Loading members...
										</div>
									) : availableMembers.length === 0 ? (
										<div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
											No available members found.
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
													{member.email}
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
							Custom Monthly Price (Optional)
						</label>
						<Input
							id="membership-price"
							value={membershipPrice}
							onChange={(event) => setMembershipPrice(event.target.value)}
							placeholder={
								group.defaultMembershipPrice
									? `Default: ${group.defaultMembershipPrice}`
									: "Leave empty to use default"
							}
						/>
						{group.defaultMembershipPrice && (
							<p className="text-muted-foreground text-xs">
								Default price: €{group.defaultMembershipPrice}
							</p>
						)}
						{priceError && (
							<p className="text-destructive text-xs">{priceError}</p>
						)}
					</div>
				</DialogPanel>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						onClick={handleSubmit}
						disabled={enrollMutation.isPending || !selectedMemberId}
					>
						{enrollMutation.isPending ? "Enrolling..." : "Enroll Member"}
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
		resolver: zodResolver(groupFormSchema as any),
		defaultValues: {
			name: group?.name ?? "",
			description: group?.description ?? "",
			defaultMembershipPrice: group?.defaultMembershipPrice ?? "",
		},
	});

	const updateGroupMutation = useMutation({
		mutationFn: async (data: {
			id: string;
			name?: string;
			description?: string;
			defaultMembershipPrice?: string;
		}) => client.groups.update(data),
		onSuccess: () => {
			toast.success("Group updated successfully");
			onSuccess?.();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message ?? "Failed to update group");
		},
	});

	const handleSubmit = (values: z.infer<typeof groupFormSchema>) => {
		if (!group) return;
		updateGroupMutation.mutate({
			id: group.id,
			name: values.name.trim(),
			description: values.description?.trim() ?? "",
			defaultMembershipPrice:
				values.defaultMembershipPrice?.trim() || undefined,
		});
	};

	const handleOpenChange = (nextOpen: boolean) => {
		onOpenChange(nextOpen);
		if (nextOpen && group) {
			form.reset({
				name: group.name ?? "",
				description: group.description ?? "",
				defaultMembershipPrice: group.defaultMembershipPrice ?? "",
			});
		}
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetPopup inset>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex h-full flex-col"
					>
						<SheetHeader>
							<SheetTitle>Edit Group</SheetTitle>
							<SheetDescription>
								Update the group name, description, and default price.
							</SheetDescription>
						</SheetHeader>
						<SheetPanel className="flex-1 grid gap-4">
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
											This is the group's display name.
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
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Group description (optional)"
												rows={3}
												{...field}
												disabled={updateGroupMutation.isPending}
											/>
										</FormControl>
										<FormDescription>
											Describe the group (optional).
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
										<FormLabel>Default Membership Price</FormLabel>
										<FormControl>
											<InputGroup>
												<InputGroupInput
													placeholder={
														group?.defaultMembershipPrice
															? `Current: ${group.defaultMembershipPrice}`
															: "0.00"
													}
													type="text"
													{...field}
													disabled={updateGroupMutation.isPending}
													pattern="^\\d+(\\.\\d{1,2})?$"
												/>
												<InputGroupAddon align="inline-end">
													<InputGroupText>€</InputGroupText>
												</InputGroupAddon>
											</InputGroup>
										</FormControl>
										<FormDescription>
											Leave empty to keep the current price.
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
								Cancel
							</SheetClose>
							<Button type="submit" disabled={updateGroupMutation.isPending}>
								{updateGroupMutation.isPending ? (
									<>
										<Spinner />
										Saving...
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
							<SheetTitle>{group.name} Members</SheetTitle>
							<SheetDescription>
								View and manage members in this group.
							</SheetDescription>
						</div>
						<Button size="sm" onClick={() => setEnrollOpen(true)}>
							Enroll Member
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
							placeholder="Search members..."
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
										<EmptyTitle>Failed to load members</EmptyTitle>
										<EmptyDescription>
											{error instanceof Error
												? error.message
												: "Something went wrong. Please try again."}
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
											<TableHead>Email</TableHead>
											<TableHead>Phone</TableHead>
											<TableHead className="text-right">Actions</TableHead>
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
													No members found.
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
													<TableCell>{member.email}</TableCell>
													<TableCell>{member.phone}</TableCell>
													<TableCell className="text-right">
														<Button
															size="sm"
															variant="outline"
															render={
																<Link href={`/dashboard/members/${member.id}`}>
																	View
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
							Page {page} of {totalPages}
						</span>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={page <= 1}
								onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							>
								Previous
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={page >= totalPages}
								onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
							>
								Next
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
