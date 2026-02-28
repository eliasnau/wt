"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import {
	Sheet,
	SheetClose,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";

interface NewGroupSheetProps {
	onGroupCreated?: () => void;
}

const formSchema = z.object({
	name: z.string().min(3, {
		message: "Name muss mindestens 3 Zeichen lang sein.",
	}),
	description: z.string().optional(),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
		message: "Please enter a valid hex color (e.g., #000000)",
	}),
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
			color: "#000000",
			defaultMembershipPrice: "",
		},
	});

	const createGroupMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			description?: string;
			color: string;
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
			color: values.color.toLowerCase(),
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
								name="color"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Color *</FormLabel>
										<FormControl>
											<div className="flex items-center gap-3">
												<Input
													type="color"
													value={field.value}
													onChange={field.onChange}
													disabled={createGroupMutation.isPending}
													className="h-10 w-14 p-1"
													required
												/>
												<Input
													type="text"
													value={field.value}
													onChange={field.onChange}
													placeholder="#000000"
													disabled={createGroupMutation.isPending}
													pattern="^#[0-9A-Fa-f]{6}$"
													required
												/>
											</div>
										</FormControl>
										<FormDescription>
											Required hex color used to identify this group.
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
													pattern="^[0-9]+(\\.[0-9]{1,2})?$"
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
