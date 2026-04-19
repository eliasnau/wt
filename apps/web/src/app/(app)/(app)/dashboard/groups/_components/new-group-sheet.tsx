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

	const parsed = Number(normalizedValue);
	if (Number.isNaN(parsed)) {
		return undefined;
	}

	return Math.round(parsed * 100);
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
										<FormLabel>Farbe</FormLabel>
										<FormControl>
											<div className="flex flex-wrap items-center gap-2">
												{GROUP_COLOR_PRESETS.map((preset) => {
													const isSelected =
														field.value?.toLowerCase() === preset.hex;

													return (
														<button
															key={preset.hex}
															type="button"
															onClick={() => field.onChange(preset.hex)}
															disabled={createGroupMutation.isPending}
															className={`size-7 rounded-full border transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring ${
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
												<Button
													type="button"
													size="icon-sm"
													variant="outline"
													className="size-7 rounded-full"
													onClick={() =>
														field.onChange(getRandomGroupColor(field.value))
													}
													disabled={createGroupMutation.isPending}
													title="Zufällige Farbe"
													aria-label="Zufällige Farbe"
												>
													<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
												</Button>
											</div>
										</FormControl>
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
