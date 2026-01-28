"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { client } from "@/utils/orpc";

const firstNameSchema = z.string().min(1, "First name is required").max(255);
const lastNameSchema = z.string().min(1, "Last name is required").max(255);
const emailSchema = z.string().email("Invalid email address");
const phoneSchema = z.string().min(1, "Phone is required");
const streetSchema = z.string().min(1, "Street is required");
const citySchema = z.string().min(1, "City is required");
const stateSchema = z.string().min(1, "State is required");
const postalCodeSchema = z.string().min(1, "Postal code is required");
const countrySchema = z.string().min(1, "Country is required");
const ibanSchema = z.string().min(1, "IBAN is required");
const bicSchema = z.string().min(1, "BIC is required");
const cardHolderSchema = z.string().min(1, "Card holder name is required");
const contractStartDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}$/, "Please select a month and year");
const contractMonthSchema = z.string().min(1, "Please select a month");
const contractYearSchema = z.string().min(1, "Please select a year");
const amountSchema = z
	.string()
	.refine(
		(val) => val === "" || /^\d+(\.\d{1,2})?$/.test(val),
		"Invalid amount format",
	);
const notesSchema = z.string().max(1000, "Maximum 1000 characters");

const formSchema = z.object({
	firstName: firstNameSchema,
	lastName: lastNameSchema,
	email: emailSchema,
	phone: phoneSchema,
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

export function NewMemberForm() {
	const router = useRouter();

	const createMemberMutation = useMutation({
		mutationFn: async (data: {
			firstName: string;
			lastName: string;
			email: string;
			phone: string;
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
		}) => {
			return await client.members.create(data);
		},
		onSuccess: () => {
			toast.success("Member created successfully");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to create member",
			);
		},
	});

	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
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
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			const submissionData = {
				firstName: value.firstName,
				lastName: value.lastName,
				email: value.email,
				phone: value.phone,
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
			await createMemberMutation.mutateAsync(submissionData);
		},
	});

	const { isPending: isLoading } = createMemberMutation;
	const hasSucceeded = createMemberMutation.isSuccess;

	if (hasSucceeded) {
		return (
			<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 flex size-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-950">
							<Check className="size-8 text-green-500" />
						</div>
						<h2 className="mb-2 text-2xl font-bold">Member Created</h2>
						<p className="mb-6 text-lg text-muted-foreground">
							The member has been successfully added to your organization
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => router.push("/dashboard/members")}
							>
								View All Members
							</Button>
							<Button onClick={() => createMemberMutation.reset()}>
								Add Another Member
							</Button>
						</div>
					</div>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
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
						Member Information
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Add a new member with their personal, address, and contract details
					</p>

					<FieldGroup className="space-y-6">
						<div className="space-y-4">
							<h3 className="font-semibold text-foreground text-sm">
								Personal Information
							</h3>
							<div className="grid gap-4 md:grid-cols-2">
								<form.Field name="firstName">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="firstName">
													First Name *
												</FieldLabel>
												<Input
													id="firstName"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="John"
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
												<FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
												<Input
													id="lastName"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Doe"
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
												<FieldLabel htmlFor="email">Email *</FieldLabel>
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

								<form.Field name="phone">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="phone">Phone *</FieldLabel>
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

							<form.Field name="memberNotes">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="memberNotes">
												Member Notes
											</FieldLabel>
											<Textarea
												id="memberNotes"
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Additional notes about the member..."
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
							<h3 className="font-semibold text-foreground text-sm">Address</h3>
							<div className="grid gap-4">
								<form.Field name="street">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor="street">
													Street Address *
												</FieldLabel>
												<Input
													id="street"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="123 Main St"
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
													<FieldLabel htmlFor="city">City *</FieldLabel>
													<Input
														id="city"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="New York"
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
													<FieldLabel htmlFor="state">State *</FieldLabel>
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
														Postal Code *
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
													<FieldLabel htmlFor="country">Country *</FieldLabel>
													<Input
														id="country"
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="United States"
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
								Payment Information
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
														Card Holder Name *
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
								Contract Details
							</h3>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<FieldLabel>Start Date *</FieldLabel>
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
															onValueChange={(value) =>
																field.handleChange(value || "")
															}
														>
															<SelectTrigger
																id="contractStartMonth"
																aria-invalid={isInvalid}
															>
																<SelectValue placeholder="Month" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="01">January</SelectItem>
																<SelectItem value="02">February</SelectItem>
																<SelectItem value="03">March</SelectItem>
																<SelectItem value="04">April</SelectItem>
																<SelectItem value="05">May</SelectItem>
																<SelectItem value="06">June</SelectItem>
																<SelectItem value="07">July</SelectItem>
																<SelectItem value="08">August</SelectItem>
																<SelectItem value="09">September</SelectItem>
																<SelectItem value="10">October</SelectItem>
																<SelectItem value="11">November</SelectItem>
																<SelectItem value="12">December</SelectItem>
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
															onValueChange={(value) =>
																field.handleChange(value || "")
															}
														>
															<SelectTrigger
																id="contractStartYear"
																aria-invalid={isInvalid}
															>
																<SelectValue placeholder="Year" />
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
														<SelectValue placeholder="Select period" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="monthly">Monthly</SelectItem>
														<SelectItem value="half_yearly">
															Half Yearly
														</SelectItem>
														<SelectItem value="yearly">Yearly</SelectItem>
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
													Joining Fee Amount
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
													Yearly Fee Amount
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
													Contract Notes
												</FieldLabel>
												<Textarea
													id="contractNotes"
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Additional notes about the contract..."
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
						Cancel
					</Button>
					<Button disabled={isLoading} type="submit" form="new-member-form">
						{isLoading ? "Creating..." : "Create Member"}
					</Button>
				</FrameFooter>
			</form>
		</Frame>
	);
}
