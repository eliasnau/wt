"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormLabel,
	FormItem,
	FormDescription,
	FormControl,
	FormField,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Spinner } from "@/components/ui/spinner";

interface NewGroupSheetProps {
	onGroupCreated?: () => void;
}

const formSchema = z.object({
	name: z.string().min(3, {
		message: "Name muss mindestens 3 Zeichen lang sein.",
	}),
	description: z.string().optional(),
	defaultMembershipPrice: z
		.string()
		.optional()
		.refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
			message: "Please enter a valid price (e.g., 10 or 10.99)",
		}),
});

export function NewGroupSheet({ onGroupCreated }: NewGroupSheetProps) {
	const [open, setOpen] = React.useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema as any),
		defaultValues: {
			name: "",
			description: "",
			defaultMembershipPrice: "",
		},
	});

	const createGroupMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			description?: string;
			defaultMembershipPrice?: string;
		}) => {
			return client.groups.create(data);
		},
		onSuccess: () => {
			toast.success("Gruppe erfolgreich erstellt");
			form.reset();
			onGroupCreated?.();
			setOpen(false);
		},
		onError: (error) => {
			toast.error(error.message ?? "Gruppe konnte nicht erstellt werden");
		},
	});

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		createGroupMutation.mutate({
			name: values.name.trim(),
			description: values.description?.trim(),
			defaultMembershipPrice:
				values.defaultMembershipPrice?.trim() || undefined,
		});
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger render={<Button variant="default" />}>
				<Plus className="mr-2 h-4 w-4" />
				New Group
			</SheetTrigger>
			<SheetPopup inset>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex h-full flex-col"
					>
						<SheetHeader>
							<SheetTitle>Gruppe erstellen</SheetTitle>
							<SheetDescription>
								Create a new group with name, description, and membership price
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
												disabled={createGroupMutation.isPending}
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
												disabled={createGroupMutation.isPending}
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
										<FormLabel>Standard-Mitgliedsbeitrag</FormLabel>
										<FormControl>
											<InputGroup>
												<InputGroupInput
													placeholder="0.00"
													type="text"
													{...field}
													disabled={createGroupMutation.isPending}
													pattern="^\d+(\.\d{1,2})?$"
												/>
												<InputGroupAddon align="inline-end">
													<InputGroupText>€</InputGroupText>
												</InputGroupAddon>
											</InputGroup>
										</FormControl>
										<FormDescription>
											Optional. Enter a default price for new memberships.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</SheetPanel>
						<SheetFooter>
							<SheetClose
								render={<Button variant="ghost" />}
								disabled={createGroupMutation.isPending}
							>
								Cancel
							</SheetClose>
							<Button type="submit" disabled={createGroupMutation.isPending}>
								{createGroupMutation.isPending ? (
									<>
										<Spinner />
										Creating...
									</>
								) : (
									"Gruppe erstellen"
								)}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetPopup>
		</Sheet>
	);
}
