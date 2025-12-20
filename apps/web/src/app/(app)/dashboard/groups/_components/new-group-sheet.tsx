"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Field } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Sheet,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetFooter,
	SheetPopup,
	SheetTrigger,
	SheetPanel,
	SheetClose,
} from "@/components/ui/sheet";
import { Plus, Loader2 } from "lucide-react";
import { client, orpc } from "@/utils/orpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface NewGroupSheetProps {
	onGroupCreated?: () => void;
}

export function NewGroupSheet({ onGroupCreated }: NewGroupSheetProps) {
	const [open, setOpen] = React.useState(false);
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [price, setPrice] = React.useState("");

	const createGroupMutation = useMutation({
		mutationFn: async (data: { name: string; description: string; defaultMembershipPrice?: string }) => {
			return client.groups.create(data);
		},
		onSuccess: () => {
			toast.success("Group created successfully");
			setOpen(false);
			setName("");
			setDescription("");
			setPrice("");
			onGroupCreated?.();
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Failed to create group");
		},
	});

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		
		if (!name.trim()) {
			toast.error("Name is required");
			return;
		}
		if (!description.trim()) {
			toast.error("Description is required");
			return;
		}

		createGroupMutation.mutate({
			name: name.trim(),
			description: description.trim(),
			defaultMembershipPrice: price.trim() || undefined,
		});
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger render={<Button variant="default" />}>
				<Plus className="mr-2 h-4 w-4" />
				New Group
			</SheetTrigger>
			<SheetPopup inset>
				<Form className="h-full gap-0" onSubmit={handleSubmit}>
					<SheetHeader>
						<SheetTitle>Create Group</SheetTitle>
						<SheetDescription>Create a new group with name, description, and membership price</SheetDescription>
					</SheetHeader>
					<SheetPanel className="grid gap-4">
						<Field>
							<FieldLabel>Name *</FieldLabel>
							<Input
								placeholder="Kids"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={createGroupMutation.isPending}
								required
							/>
						</Field>
						<Field>
							<FieldLabel>Description</FieldLabel>
							<Textarea
								placeholder="Group description (optional)"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={createGroupMutation.isPending}
								rows={3}
							/>
						</Field>
						<Field>
							<FieldLabel>Default Membership Price</FieldLabel>
							<Input
								placeholder="0.00"
								type="text"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								disabled={createGroupMutation.isPending}
								pattern="^\d+(\.\d{1,2})?$"
							/>
						</Field>
					</SheetPanel>
					<SheetFooter>
						<SheetClose render={<Button variant="ghost" />} disabled={createGroupMutation.isPending}>
							Cancel
						</SheetClose>
						<Button type="submit" disabled={createGroupMutation.isPending}>
							{createGroupMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Group"
							)}
						</Button>
					</SheetFooter>
				</Form>
			</SheetPopup>
		</Sheet>
	);
}
