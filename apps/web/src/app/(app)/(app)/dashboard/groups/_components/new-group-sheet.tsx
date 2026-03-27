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
import {
	DEFAULT_GROUP_COLOR,
	GROUP_COLOR_PRESETS,
	getRandomGroupColor,
} from "./group-color-presets";

function parsePriceValue(value: string) {
	const normalizedValue = value.trim();
	if (!normalizedValue) {
		return undefined;
	}

	return Math.round(Number(normalizedValue) * 100);
}

interface NewGroupSheetProps {
	onGroupCreated?: () => void;
}

const formSchema = z.object({
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

export function NewGroupSheet({ onGroupCreated }: NewGroupSheetProps) {
	const [open, setOpen] = React.useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			color: DEFAULT_GROUP_COLOR,
			defaultMembershipPrice: "",
		},
	});

	const createGroupMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			description?: string;
			color: string;
			defaultMembershipPriceCents?: number;
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
			defaultMembershipPriceCents: parsePriceValue(
				values.defaultMembershipPrice ?? "",
			),
		});
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger render={<Button variant="default" />}>
				<Plus className="mr-2 h-4 w-4" />
				Neue Gruppe
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
								Erstelle eine neue Gruppe mit Name, Beschreibung und
								Mitgliedsbeitrag
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
												disabled={createGroupMutation.isPending}
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
												disabled={createGroupMutation.isPending}
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
																disabled={createGroupMutation.isPending}
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
														disabled={createGroupMutation.isPending}
														className="h-10 w-14 p-1"
														required
													/>
													<Input
														type="text"
														value={field.value}
														onChange={field.onChange}
														placeholder={DEFAULT_GROUP_COLOR}
														disabled={createGroupMutation.isPending}
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
											Optional. Gib einen Standardpreis für neue Mitgliedschaften ein.
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
								Abbrechen
							</SheetClose>
							<Button type="submit" disabled={createGroupMutation.isPending}>
								{createGroupMutation.isPending ? (
									<>
										<Spinner />
										Wird erstellt...
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
