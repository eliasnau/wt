"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	isFreeMembershipPrice,
	isMembershipPriceInputValid,
	normalizeMembershipPriceInput,
	parseMembershipPriceInput,
} from "@/utils/membership-price";
import { client, orpc } from "@/utils/orpc";

const assignGroupSchema = z.object({
	groupId: z.string().min(1, "Bitte wähle eine Gruppe"),
	membershipPrice: z
		.string()
		.refine(isMembershipPriceInputValid, "Ungültiges Preisformat")
		.optional()
		.or(z.literal("")),
});

interface AssignGroupDialogProps {
	memberId: string;
	onSuccess?: () => void;
}

export function AssignGroupDialog({
	memberId,
	onSuccess,
}: AssignGroupDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const { data: groups, isLoading: isLoadingGroups } = useQuery(
		orpc.groups.list.queryOptions({}),
	);

	const assignGroupMutation = useMutation({
		mutationFn: async (data: { groupId: string; membershipPrice?: number }) => {
			return await client.members.assignGroup({
				memberId,
				groupId: data.groupId,
				membershipPrice: data.membershipPrice,
			});
		},
		onSuccess: () => {
			toast.success("Mitglied erfolgreich einer Gruppe zugewiesen");
			queryClient.invalidateQueries({
				queryKey: orpc.members.get.queryKey({ input: { memberId } }),
			});
			setOpen(false);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "Gruppe konnte nicht zugewiesen werden",
			);
		},
	});

	const form = useForm({
		defaultValues: {
			groupId: "",
			membershipPrice: "",
		},
		validators: {
			onSubmit: assignGroupSchema as any,
		},
		onSubmit: async ({ value }) => {
			await assignGroupMutation.mutateAsync({
				groupId: value.groupId,
				membershipPrice:
					value.membershipPrice.trim() === ""
						? undefined
						: (parseMembershipPriceInput(value.membershipPrice) ?? undefined),
			});
		},
	});

	// Subscribe to form state changes to update UI based on selected group
	return (
		<Dialog
			open={open}
			onOpenChange={(newOpen) => {
				setOpen(newOpen);
				if (!newOpen) {
					form.reset();
					assignGroupMutation.reset();
				}
			}}
		>
			<DialogTrigger render={<Button size="sm" variant="outline" />}>
				<PlusIcon className="size-4" />
				Assign to Group
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Zur Gruppe zuweisen</DialogTitle>
					<DialogDescription>
						Add this member to a group. If you leave the price empty, the
						current group default will be copied to this membership.
					</DialogDescription>
				</DialogHeader>

				<form
					id="assign-group-form"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<DialogPanel className="space-y-4">
						<form.Field name="groupId">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="groupId">Gruppe *</FieldLabel>
										<Select
											name={field.name}
											value={field.state.value}
											onValueChange={(value) => {
												if (value) {
													field.handleChange(value);
												}
											}}
											items={groups?.map((group) => ({
												value: group.id,
												label: group.name,
											}))}
											disabled={isLoadingGroups}
										>
											<SelectTrigger id="groupId" aria-invalid={isInvalid}>
												<SelectValue placeholder="Eine Gruppe auswählen" />
											</SelectTrigger>
											<SelectContent>
												{groups?.map((group) => (
													<SelectItem key={group.id} value={group.id}>
														{group.name}
													</SelectItem>
												))}
												{groups?.length === 0 && (
													<div className="p-2 text-center text-muted-foreground text-sm">
														Keine Gruppen gefunden
													</div>
												)}
											</SelectContent>
										</Select>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Subscribe selector={(state) => state.values.groupId}>
							{(selectedGroupId) => {
								const selectedGroup = groups?.find(
									(g) => g.id === selectedGroupId,
								);
								return (
									<form.Field name="membershipPrice">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											const parsedMembershipPrice = parseMembershipPriceInput(
												field.state.value,
											);
											return (
												<Field data-invalid={isInvalid}>
													<div className="flex items-center gap-2">
														<FieldLabel htmlFor="membershipPrice">
															Monthly Price (Optional)
														</FieldLabel>
														{parsedMembershipPrice === 0 ? (
															<Badge variant="secondary">Free</Badge>
														) : null}
													</div>
													<Input
														id="membershipPrice"
														name={field.name}
														value={field.state.value}
														onBlur={() => {
															field.handleBlur();
															field.handleChange(
																normalizeMembershipPriceInput(
																	field.state.value,
																),
															);
														}}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder={
															selectedGroup?.defaultMembershipPrice
																? `Current default: ${selectedGroup.defaultMembershipPrice}`
																: "Leer lassen, um €0.00 zu verwenden"
														}
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
													{selectedGroup?.defaultMembershipPrice && (
														<div className="flex items-center gap-2 text-muted-foreground text-xs">
															<p>
																Current group default: €
																{selectedGroup.defaultMembershipPrice}
															</p>
															{isFreeMembershipPrice(
																selectedGroup.defaultMembershipPrice,
															) ? (
																<Badge variant="secondary">Free</Badge>
															) : null}
														</div>
													)}
												</Field>
											);
										}}
									</form.Field>
								);
							}}
						</form.Subscribe>
					</DialogPanel>
				</form>

				<DialogFooter>
					<DialogClose render={<Button type="button" variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						type="submit"
						form="assign-group-form"
						disabled={assignGroupMutation.isPending}
					>
						{assignGroupMutation.isPending
							? "Wird zugewiesen..."
							: "Gruppe zuweisen"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
