"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	isFreeMembershipPrice,
	normalizeMembershipPriceInput,
	parseMembershipPriceInput,
} from "@/utils/membership-price";
import { client, orpc } from "@/utils/orpc";

const firstNameSchema = z.string().min(1, "Vorname ist erforderlich").max(255);
const lastNameSchema = z.string().min(1, "Nachname ist erforderlich").max(255);
const birthdateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat")
	.optional()
	.or(z.literal(""));
const emailSchema = z
  .string()
  .trim()
  .email("Ungültige E-Mail-Adresse")
  .or(z.string().trim().length(0));

const phoneSchema = z.string().trim().max(255, "Telefon ist zu lang");
const streetSchema = z.string().min(1, "Straße ist erforderlich");
const citySchema = z.string().min(1, "Stadt ist erforderlich");
const stateSchema = z.string().min(1, "Bundesland ist erforderlich");
const postalCodeSchema = z.string().min(1, "Postleitzahl ist erforderlich");
const countrySchema = z.string().min(1, "Land ist erforderlich");
const ibanSchema = z.string().min(1, "IBAN ist erforderlich");
const bicSchema = z.string().min(1, "BIC ist erforderlich");
const cardHolderSchema = z
	.string()
	.min(1, "Name des Kontoinhabers ist erforderlich");
const contractStartDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}$/, "Bitte wähle Monat und Jahr");
const contractMonthSchema = z.string().min(1, "Bitte wähle einen Monat");
const contractYearSchema = z.string().min(1, "Bitte wähle ein Jahr");
const amountSchema = z
	.string()
	.refine(
		(val) => val === "" || /^\d+(\.\d{1,2})?$/.test(val),
		"Ungültiges Betragsformat",
	);
const guardianNameSchema = z.string().optional();
const guardianEmailSchema = z
	.string()
	.email("Ungültige E-Mail-Adresse")
	.optional()
	.or(z.literal(""));
const guardianPhoneSchema = z.string().optional();
const notesSchema = z.string().max(1000, "Maximal 1000 Zeichen");
const formSchema = z.object({
	firstName: firstNameSchema,
	lastName: lastNameSchema,
	birthdate: birthdateSchema,
	email: emailSchema,
	phone: phoneSchema,
	guardianName: guardianNameSchema,
	guardianEmail: guardianEmailSchema,
	guardianPhone: guardianPhoneSchema,
	street: streetSchema,
	city: citySchema,
	state: stateSchema,
	postalCode: postalCodeSchema,
	country: countrySchema,
	iban: ibanSchema,
	bic: bicSchema,
	cardHolder: cardHolderSchema,
	contractStartMonth: contractMonthSchema,
	contractStartYear: contractYearSchema,
	initialPeriod: z.enum(["monthly", "half_yearly", "yearly"]),
	joiningFeeAmount: amountSchema,
	yearlyFeeAmount: amountSchema,
	memberNotes: notesSchema,
	contractNotes: notesSchema,
});

type GroupAssignment = {
	groupId: string;
	membershipPrice?: number;
};

const CONTRACT_START_MONTH_ITEMS = [
	{ value: "01", label: "Januar" },
	{ value: "02", label: "Februar" },
	{ value: "03", label: "März" },
	{ value: "04", label: "April" },
	{ value: "05", label: "Mai" },
	{ value: "06", label: "Juni" },
	{ value: "07", label: "Juli" },
	{ value: "08", label: "August" },
	{ value: "09", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Dezember" },
] as const;

const INITIAL_PERIOD_ITEMS = [
	{ value: "monthly", label: "Monatlich" },
	{ value: "half_yearly", label: "Halbjährlich" },
	{ value: "yearly", label: "Jährlich" },
] as const;

export function NewMemberForm() {
	const router = useRouter();
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
	const [groupPrices, setGroupPrices] = useState<Record<string, string>>({});

	const { data: groups = [], isLoading: isLoadingGroups } = useQuery(
		orpc.groups.list.queryOptions({}),
	);

	const priceErrors = useMemo(() => {
		return selectedGroupIds.reduce<Record<string, string | undefined>>(
			(errors, groupId) => {
				const value = groupPrices[groupId];
				if (value && parseMembershipPriceInput(value) === null) {
					errors[groupId] = "Ungültiges Preisformat";
				}
				return errors;
			},
			{},
		);
	}, [groupPrices, selectedGroupIds]);

	const hasInvalidGroupPrice = Object.keys(priceErrors).length > 0;

	const createMemberMutation = useMutation({
		mutationFn: async (data: {
			firstName: string;
			lastName: string;
			birthdate?: string;
			email: string;
			phone: string;
			guardianName?: string;
			guardianEmail?: string;
			guardianPhone?: string;
			street: string;
			city: string;
			state: string;
			postalCode: string;
			country: string;
			iban: string;
			bic: string;
			cardHolder: string;
			contractStartDate: string;
			initialPeriod: "monthly" | "half_yearly" | "yearly";
			joiningFeeAmount?: string;
			yearlyFeeAmount?: string;
			memberNotes?: string;
			contractNotes?: string;
			groupAssignments: GroupAssignment[];
		}) => {
			const { groupAssignments, ...memberData } = data;
			const result = await client.members.create(memberData);
			const failedAssignments: GroupAssignment[] = [];

			for (const assignment of groupAssignments) {
				try {
					await client.members.assignGroup({
						memberId: result.member.id,
						groupId: assignment.groupId,
						membershipPrice: assignment.membershipPrice,
					});
				} catch {
					failedAssignments.push(assignment);
				}
			}

			return { result, failedAssignments };
		},
		onSuccess: ({ failedAssignments }) => {
			toast.success("Mitglied erfolgreich erstellt");
			if (failedAssignments.length > 0) {
				toast.error(
					`Mitglied wurde erstellt, aber ${failedAssignments.length} Gruppenzuweisung${
						failedAssignments.length === 1 ? "" : "en"
					} ${failedAssignments.length === 1 ? "ist" : "sind"} fehlgeschlagen.`,
				);
			}
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "Mitglied konnte nicht erstellt werden",
			);
		},
	});

	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			birthdate: "",
			email: "",
			phone: "",
			guardianName: "",
			guardianEmail: "",
			guardianPhone: "",
			street: "",
			city: "",
			state: "",
			postalCode: "",
			country: "",
			iban: "",
			bic: "",
			cardHolder: "",
			contractStartMonth: (() => {
				const nextMonth = new Date();
				nextMonth.setMonth(nextMonth.getMonth() + 1);
				return (nextMonth.getMonth() + 1).toString().padStart(2, "0");
			})(),
			contractStartYear: (() => {
				const nextMonth = new Date();
				nextMonth.setMonth(nextMonth.getMonth() + 1);
				return nextMonth.getFullYear().toString();
			})(),
			initialPeriod: "monthly" as "monthly" | "half_yearly" | "yearly",
			joiningFeeAmount: "",
			yearlyFeeAmount: "",
			memberNotes: "",
			contractNotes: "",
		},
		validators: {
			onSubmit: formSchema as any,
		},
		onSubmit: async ({ value }) => {
			const submissionData = {
				firstName: value.firstName,
				lastName: value.lastName,
				birthdate: value.birthdate || undefined,
				email: value.email.trim(),
				phone: value.phone.trim(),
				guardianName: value.guardianName,
				guardianEmail: value.guardianEmail,
				guardianPhone: value.guardianPhone,
				street: value.street,
				city: value.city,
				state: value.state,
				postalCode: value.postalCode,
				country: value.country,
				iban: value.iban,
				bic: value.bic,
				cardHolder: value.cardHolder,
				contractStartDate: `${value.contractStartYear}-${value.contractStartMonth}-01`,
				initialPeriod: value.initialPeriod,
				joiningFeeAmount: value.joiningFeeAmount,
				yearlyFeeAmount: value.yearlyFeeAmount,
				memberNotes: value.memberNotes,
				contractNotes: value.contractNotes,
			};
			if (hasInvalidGroupPrice) {
				toast.error(
					"Bitte behebe die Fehler bei den Gruppenpreisen vor dem Absenden.",
				);
				return;
			}

			const groupAssignments = selectedGroupIds.map((groupId) => {
				const membershipPrice = groupPrices[groupId];
				return {
					groupId,
					membershipPrice:
						membershipPrice?.trim() &&
						parseMembershipPriceInput(membershipPrice) !== null
							? (parseMembershipPriceInput(membershipPrice) ?? undefined)
							: undefined,
				};
			});

			await createMemberMutation.mutateAsync({
				...submissionData,
				groupAssignments,
			});
		},
	});

	const { isPending: isLoading } = createMemberMutation;
	const hasSucceeded = createMemberMutation.isSuccess;

	if (hasSucceeded) {
		return (
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 flex size-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-950">
							<Check className="size-8 text-green-500" />
						</div>
						<h2 className="mb-2 font-bold text-2xl">Mitglied erstellt</h2>
						<p className="mb-6 text-lg text-muted-foreground">
							Das Mitglied wurde deiner Organisation erfolgreich hinzugefügt
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => router.push("/dashboard/members")}
							>
								Alle Mitglieder anzeigen
							</Button>
							<Button onClick={() => createMemberMutation.reset()}>
								Weiteres Mitglied hinzufügen
							</Button>
						</div>
					</div>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<form
				id="new-member-form"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Mitgliedsdaten
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Füge ein neues Mitglied mit seinen persönlichen Daten, seiner
						Adresse und Vertragsdaten hinzu
					</p>

					<FieldGroup className="space-y-6">
						<div className="space-y-4">
							<h3 className="font-semibold text-foreground text-sm">
								Persönliche Daten
							</h3>
							<div className="grid gap-4 md:grid-cols-2">
								<form.Field name="firstName">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="firstName">
													Vorname *
												</FieldLabel>
												<Input
													id="firstName"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Max"
													type="text"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="lastName">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="lastName">Nachname *</FieldLabel>
												<Input
													id="lastName"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Mustermann"
													type="text"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="email">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="email">E-Mail</FieldLabel>
												<Input
													id="email"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="john.doe@example.com"
													type="email"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="birthdate">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="birthdate">
													Geburtsdatum
												</FieldLabel>
												<Input
													id="birthdate"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													type="date"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="phone">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="phone">Telefon</FieldLabel>
												<Input
													id="phone"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="+1 234 567 8900"
													type="tel"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
							</div>

							<FieldSeparator />

							<div className="space-y-4">
								<h3 className="font-semibold text-foreground text-sm">
									Daten des Erziehungsberechtigten (optional)
								</h3>
								<div className="grid gap-4 md:grid-cols-2">
									<form.Field name="guardianName">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="guardianName">Name</FieldLabel>
													<Input
														id="guardianName"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="Name des Erziehungsberechtigten"
														type="text"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>
									<form.Field name="guardianEmail">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="guardianEmail">
														E-Mail
													</FieldLabel>
													<Input
														id="guardianEmail"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="guardian@example.com"
														type="email"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>
									<form.Field name="guardianPhone">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="guardianPhone">
														Telefon
													</FieldLabel>
													<Input
														id="guardianPhone"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="+1 234 567 8900"
														type="tel"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>
								</div>
							</div>

							<form.Field name="memberNotes">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="memberNotes">
												Mitgliedsnotizen
											</FieldLabel>
											<Textarea
												id="memberNotes"
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Zusätzliche Notizen zum Mitglied..."
												rows={3}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							</form.Field>
						</div>

						<FieldSeparator />

						<div className="space-y-4">
							<h3 className="font-semibold text-foreground text-sm">Adresse</h3>
							<div className="grid gap-4">
								<form.Field name="street">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="street">
													Straße und Hausnummer *
												</FieldLabel>
												<Input
													id="street"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Musterstraße 123"
													type="text"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<div className="grid gap-4 md:grid-cols-2">
									<form.Field name="city">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="city">Stadt *</FieldLabel>
													<Input
														id="city"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="Berlin"
														type="text"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>

									<form.Field name="state">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="state">Bundesland *</FieldLabel>
													<Input
														id="state"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="NY"
														type="text"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>

									<form.Field name="postalCode">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="postalCode">
														Postleitzahl *
													</FieldLabel>
													<Input
														id="postalCode"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="10001"
														type="text"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>

									<form.Field name="country">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="country">Land *</FieldLabel>
													<Input
														id="country"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="Deutschland"
														type="text"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>
								</div>
							</div>
						</div>

						<FieldSeparator />

						<div className="space-y-4">
							<div>
								<h3 className="font-semibold text-foreground text-sm">
									Gruppenzuweisungen
								</h3>
								<p className="text-muted-foreground text-sm">
									Weise dieses Mitglied einer oder mehreren Gruppen zu. Du
									kannst den Standard-Mitgliedsbeitrag pro Gruppe überschreiben.
								</p>
							</div>

							{isLoadingGroups ? (
								<p className="text-muted-foreground text-sm">
									Gruppen werden geladen...
								</p>
							) : groups.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									Keine Gruppen gefunden. Erstelle eine Gruppe, um Mitglieder
									zuzuweisen.
								</p>
							) : (
								<div className="space-y-3">
									{groups.map((group) => {
										const isSelected = selectedGroupIds.includes(group.id);
										const priceError = priceErrors[group.id];
										return (
											<div
												key={group.id}
												className="flex items-start gap-3 rounded-lg border bg-background p-3"
											>
												<Checkbox
													checked={isSelected}
													onCheckedChange={(checked) => {
														const isChecked = checked === true;
														setSelectedGroupIds((prev) => {
															if (isChecked) {
																return prev.includes(group.id)
																	? prev
																	: [...prev, group.id];
															}
															const next = prev.filter((id) => id !== group.id);
															setGroupPrices((prices) => {
																if (!(group.id in prices)) return prices;
																return Object.fromEntries(
																	Object.entries(prices).filter(
																		([key]) => key !== group.id,
																	),
																);
															});
															return next;
														});
													}}
													disabled={isLoading}
													aria-label={`${group.name} auswählen`}
												/>
												<div className="flex-1 space-y-2">
													<div className="flex flex-wrap items-center justify-between gap-2">
														<span className="font-medium text-sm">
															{group.name}
														</span>
														<div className="flex items-center gap-2">
															{group.defaultMembershipPrice ? (
																<span className="text-muted-foreground text-xs">
																	Standard: €{group.defaultMembershipPrice}
																</span>
															) : null}
															{isFreeMembershipPrice(
																group.defaultMembershipPrice,
															) ? (
																<Badge variant="secondary">Kostenlos</Badge>
															) : null}
														</div>
													</div>
													{group.description ? (
														<p className="text-muted-foreground text-xs">
															{group.description}
														</p>
													) : null}

													{isSelected ? (
														<div className="space-y-1.5">
															<div className="flex items-center gap-2">
																<FieldLabel htmlFor={`group-price-${group.id}`}>
																	Monatlicher Beitrag (optional)
																</FieldLabel>
																{parseMembershipPriceInput(
																	groupPrices[group.id] ?? "",
																) === 0 ? (
																	<Badge variant="secondary">
																		Kostenlos
																	</Badge>
																) : null}
															</div>
															<Input
																id={`group-price-${group.id}`}
																value={groupPrices[group.id] ?? ""}
																onChange={(event) => {
																	const value = event.target.value;
																	setGroupPrices((prev) => ({
																		...prev,
																		[group.id]: value,
																	}));
																}}
																onBlur={() => {
																	setGroupPrices((prev) => ({
																		...prev,
																		[group.id]: normalizeMembershipPriceInput(
																			prev[group.id] ?? "",
																		),
																	}));
																}}
																placeholder={
																	group.defaultMembershipPrice
																		? `Standard: ${group.defaultMembershipPrice}`
																		: "Leer lassen, um den Standard zu verwenden"
																}
																aria-invalid={!!priceError}
															/>
															{priceError ? (
																<p className="text-destructive text-xs">
																	{priceError}
																</p>
															) : null}
														</div>
													) : null}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>

						<FieldSeparator />

						<div className="space-y-4">
							<h3 className="font-semibold text-foreground text-sm">
								Zahlungsinformationen
							</h3>
							<div className="grid gap-4">
								<form.Field name="iban">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="iban">IBAN *</FieldLabel>
												<Input
													id="iban"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="DE89370400440532013000"
													type="text"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<div className="grid gap-4 md:grid-cols-2">
									<form.Field name="bic">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="bic">BIC *</FieldLabel>
													<Input
														id="bic"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="COBADEFFXXX"
														type="text"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>

									<form.Field name="cardHolder">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor="cardHolder">
														Name des Kontoinhabers *
													</FieldLabel>
													<Input
														id="cardHolder"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="John Doe"
														type="text"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>
								</div>
							</div>
						</div>

						<FieldSeparator />

						<div className="space-y-4">
							<h3 className="font-semibold text-foreground text-sm">
								Vertragsdetails
							</h3>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<FieldLabel>Startdatum *</FieldLabel>
									<div className="flex gap-2">
										<form.Field name="contractStartMonth">
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched &&
													!field.state.meta.isValid;
												return (
													<div className="flex-1">
														<Select
															name={field.name}
															value={field.state.value}
															items={CONTRACT_START_MONTH_ITEMS}
															onValueChange={(value) =>
																field.handleChange(value || "")
															}
														>
															<SelectTrigger
																id="contractStartMonth"
																aria-invalid={isInvalid}
															>
																<SelectValue placeholder="Monat" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="01">Januar</SelectItem>
																<SelectItem value="02">Februar</SelectItem>
																<SelectItem value="03">März</SelectItem>
																<SelectItem value="04">April</SelectItem>
																<SelectItem value="05">Mai</SelectItem>
																<SelectItem value="06">Juni</SelectItem>
																<SelectItem value="07">Juli</SelectItem>
																<SelectItem value="08">August</SelectItem>
																<SelectItem value="09">September</SelectItem>
																<SelectItem value="10">Oktober</SelectItem>
																<SelectItem value="11">November</SelectItem>
																<SelectItem value="12">Dezember</SelectItem>
															</SelectContent>
														</Select>
														{isInvalid && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</div>
												);
											}}
										</form.Field>

										<form.Field name="contractStartYear">
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched &&
													!field.state.meta.isValid;
												const currentYear = new Date().getFullYear();
												const years = Array.from(
													{ length: 10 },
													(_, i) => currentYear - 5 + i,
												);
												return (
													<div className="flex-1">
														<Select
															name={field.name}
															value={field.state.value}
															items={years.map((year) => ({
																value: year.toString(),
																label: year.toString(),
															}))}
															onValueChange={(value) =>
																field.handleChange(value || "")
															}
														>
															<SelectTrigger
																id="contractStartYear"
																aria-invalid={isInvalid}
															>
																<SelectValue placeholder="Jahr" />
															</SelectTrigger>
															<SelectContent>
																{years.map((year) => (
																	<SelectItem
																		key={year}
																		value={year.toString()}
																	>
																		{year}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														{isInvalid && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</div>
												);
											}}
										</form.Field>
									</div>
								</div>

								<form.Field name="initialPeriod">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="initialPeriod">
													Initial Period *
												</FieldLabel>
												<Select
													name={field.name}
													value={field.state.value}
													items={INITIAL_PERIOD_ITEMS}
													onValueChange={(value) =>
														field.handleChange(
															value as "monthly" | "half_yearly" | "yearly",
														)
													}
												>
													<SelectTrigger
														id="initialPeriod"
														aria-invalid={isInvalid}
													>
														<SelectValue placeholder="Zeitraum wählen" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="monthly">Monatlich</SelectItem>
														<SelectItem value="half_yearly">
															Halbjährlich
														</SelectItem>
														<SelectItem value="yearly">Jährlich</SelectItem>
													</SelectContent>
												</Select>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="joiningFeeAmount">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="joiningFeeAmount">
													Aufnahmegebühr Amount
												</FieldLabel>
												<Input
													id="joiningFeeAmount"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="0.00"
													type="text"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="yearlyFeeAmount">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="yearlyFeeAmount">
													Jahresbeitrag Amount
												</FieldLabel>
												<Input
													id="yearlyFeeAmount"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="0.00"
													type="text"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
							</div>

							<div className="grid gap-4">
								<form.Field name="contractNotes">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="contractNotes">
												Vertragsnotizen
											</FieldLabel>
												<Textarea
													id="contractNotes"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Zusätzliche Notizen zum Vertrag..."
													rows={3}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
							</div>
						</div>
					</FieldGroup>
				</FramePanel>

				<FrameFooter className="flex-row justify-end gap-2">
					<Button
						disabled={isLoading}
						type="button"
						variant="ghost"
						onClick={() => router.push("/dashboard/members")}
					>
						Abbrechen
					</Button>
					<Button disabled={isLoading} type="submit" form="new-member-form">
						{isLoading ? "Wird erstellt..." : "Mitglied erstellen"}
					</Button>
				</FrameFooter>
			</form>
		</Frame>
	);
}
