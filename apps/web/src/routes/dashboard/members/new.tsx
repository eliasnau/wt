import { Button } from "@matdesk/ui/components/button";
import { Checkbox } from "@matdesk/ui/components/checkbox";
import {
	Card,
	CardFrame,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@matdesk/ui/components/card";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@matdesk/ui/components/input-group";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@matdesk/ui/components/select";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@matdesk/ui/components/table";
import { Textarea } from "@matdesk/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/members/new")({
	component: RouteComponent,
});

const INITIAL_PERIODS = [
	{ value: "monthly", label: "Monatlich" },
	{ value: "half_yearly", label: "Halbjährlich" },
	{ value: "yearly", label: "Jährlich" },
];

const YEARLY_FEE_MODES = [
	{ value: "january", label: "Im Januar" },
	{ value: "anniversary", label: "Zum Jahrestag" },
];

/** Next month as `YYYY-MM` — the usual contract start. Day rolls over years. */
function defaultContractMonth() {
	const now = new Date();
	const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	const month = String(next.getMonth() + 1).padStart(2, "0");
	return `${next.getFullYear()}-${month}`;
}

function eurosToCents(value: string): number | undefined {
	const trimmed = value.trim();
	if (trimmed === "") return undefined;
	const n = Number(trimmed);
	if (!Number.isFinite(n)) return undefined;
	return Math.round(n * 100);
}

function euroString(cents: number) {
	return String(cents / 100);
}

function RequiredMark() {
	return <span className="text-destructive"> *</span>;
}

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<CardFrame>
			<CardFrameHeader>
				<CardFrameTitle>{title}</CardFrameTitle>
				<CardFrameDescription>{description}</CardFrameDescription>
			</CardFrameHeader>
			<Card>
				<CardPanel className="grid gap-4 sm:grid-cols-2">{children}</CardPanel>
			</Card>
		</CardFrame>
	);
}

function RouteComponent() {
	const navigate = useNavigate();

	// Personal
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [birthdate, setBirthdate] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");

	// Address
	const [street, setStreet] = useState("");
	const [city, setCity] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [state, setState] = useState("");
	const [country, setCountry] = useState("Deutschland");

	// Guardian (optional)
	const [guardianName, setGuardianName] = useState("");
	const [guardianEmail, setGuardianEmail] = useState("");
	const [guardianPhone, setGuardianPhone] = useState("");

	// SEPA
	const [cardHolder, setCardHolder] = useState("");
	const [iban, setIban] = useState("");
	const [bic, setBic] = useState("");

	// Contract
	const [contractMonth, setContractMonth] = useState(defaultContractMonth());
	const [initialPeriod, setInitialPeriod] = useState("monthly");
	const [joiningFee, setJoiningFee] = useState("");
	const [yearlyFee, setYearlyFee] = useState("");
	const [yearlyFeeMode, setYearlyFeeMode] = useState("january");

	// Groups
	const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
	const [groupPrices, setGroupPrices] = useState<Record<string, string>>({});

	// Notes
	const [memberNotes, setMemberNotes] = useState("");

	const groupsQuery = useQuery(orpc.groups.list.queryOptions({}));
	const groups = groupsQuery.data ?? [];

	function toggleGroup(id: string) {
		setSelectedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	const createMutation = useMutation(
		orpc.members.create.mutationOptions({
			onSuccess: () => {
				toast.success("Mitglied erstellt");
				queryClient.invalidateQueries({ queryKey: orpc.members.query.key() });
				navigate({ to: "/dashboard/members" });
			},
			onError: (error) => toast.error(parseError(error).message),
		}),
	);

	const canSubmit =
		firstName.trim() !== "" &&
		lastName.trim() !== "" &&
		street.trim() !== "" &&
		city.trim() !== "" &&
		postalCode.trim() !== "" &&
		state.trim() !== "" &&
		country.trim() !== "" &&
		cardHolder.trim() !== "" &&
		iban.trim() !== "" &&
		bic.trim() !== "" &&
		/^\d{4}-\d{2}$/.test(contractMonth);

	function submit() {
		createMutation.mutate({
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			birthdate: birthdate || "",
			email: email.trim(),
			phone: phone.trim(),

			street: street.trim(),
			city: city.trim(),
			state: state.trim(),
			postalCode: postalCode.trim(),
			country: country.trim(),

			iban: iban.trim().toUpperCase(),
			bic: bic.trim().toUpperCase(),
			cardHolder: cardHolder.trim(),

			contractStartDate: `${contractMonth}-01`,
			initialPeriod: initialPeriod as "monthly" | "half_yearly" | "yearly",
			joiningFeeCents: eurosToCents(joiningFee),
			yearlyFeeCents: eurosToCents(yearlyFee),
			yearlyFeeMode: yearlyFeeMode as "january" | "anniversary",
			// Internal — defaulted server-side; not surfaced in this form.
			settledThroughDate: "",

			memberNotes: memberNotes.trim(),
			// Contract notes aren't captured on creation — surfaced later in the
			// member's contract view.
			contractNotes: "",

			guardianName: guardianName.trim(),
			guardianEmail: guardianEmail.trim(),
			guardianPhone: guardianPhone.trim(),

			groups: Array.from(selectedGroupIds).map((id) => {
				const groupOption = groups.find((g) => g.id === id);
				const raw =
					groupPrices[id] ?? euroString(groupOption?.defaultMembershipPriceCents ?? 0);
				const cents = Math.round(Number(raw) * 100);
				return {
					groupId: id,
					membershipPriceCents: Number.isFinite(cents) ? Math.max(0, cents) : 0,
				};
			}),
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Button
					className="-ml-2 self-start text-muted-foreground"
					render={<Link to="/dashboard/members" />}
					size="sm"
					variant="ghost"
				>
					<ArrowLeftIcon />
					Zurück zu Mitgliedern
				</Button>
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Mitglied hinzufügen</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Erfasse ein neues Mitglied samt Vertrag und SEPA-Lastschriftmandat.
					</p>
				</div>
			</div>

			<Form
				className="flex flex-col gap-6"
				onSubmit={(e) => {
					e.preventDefault();
					submit();
				}}
			>
				<Section description="Name und Kontaktangaben des Mitglieds." title="Persönliche Daten">
						<Field>
							<FieldLabel>
								Vorname
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setFirstName(e.target.value)} value={firstName} />
						</Field>
						<Field>
							<FieldLabel>
								Nachname
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setLastName(e.target.value)} value={lastName} />
						</Field>
						<Field>
							<FieldLabel>Geburtsdatum</FieldLabel>
							<Input onChange={(e) => setBirthdate(e.target.value)} type="date" value={birthdate} />
						</Field>
						<Field>
							<FieldLabel>E-Mail</FieldLabel>
							<Input
								onChange={(e) => setEmail(e.target.value)}
								placeholder="name@beispiel.de"
								type="email"
								value={email}
							/>
						</Field>
						<Field className="sm:col-span-2">
							<FieldLabel>Telefon</FieldLabel>
							<Input onChange={(e) => setPhone(e.target.value)} type="tel" value={phone} />
						</Field>
					</Section>

				<Section description="Wohnanschrift für Beitragsbescheide und Karte." title="Adresse">
						<Field className="sm:col-span-2">
							<FieldLabel>
								Straße & Hausnummer
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setStreet(e.target.value)} value={street} />
						</Field>
						<Field>
							<FieldLabel>
								PLZ
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setPostalCode(e.target.value)} value={postalCode} />
						</Field>
						<Field>
							<FieldLabel>
								Stadt
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setCity(e.target.value)} value={city} />
						</Field>
						<Field>
							<FieldLabel>
								Bundesland
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setState(e.target.value)} value={state} />
						</Field>
						<Field>
							<FieldLabel>
								Land
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setCountry(e.target.value)} value={country} />
						</Field>
					</Section>

				<Section description="Optional — bei minderjährigen Mitgliedern." title="Erziehungsberechtigte/r">
						<Field className="sm:col-span-2">
							<FieldLabel>Name</FieldLabel>
							<Input onChange={(e) => setGuardianName(e.target.value)} value={guardianName} />
						</Field>
						<Field>
							<FieldLabel>E-Mail</FieldLabel>
							<Input
								onChange={(e) => setGuardianEmail(e.target.value)}
								type="email"
								value={guardianEmail}
							/>
						</Field>
						<Field>
							<FieldLabel>Telefon</FieldLabel>
							<Input
								onChange={(e) => setGuardianPhone(e.target.value)}
								type="tel"
								value={guardianPhone}
							/>
						</Field>
					</Section>

				<Section description="Bankverbindung für den Beitragseinzug." title="SEPA-Lastschrift">
						<Field className="sm:col-span-2">
							<FieldLabel>
								Kontoinhaber
								<RequiredMark />
							</FieldLabel>
							<Input onChange={(e) => setCardHolder(e.target.value)} value={cardHolder} />
						</Field>
						<Field>
							<FieldLabel>
								IBAN
								<RequiredMark />
							</FieldLabel>
							<Input
								className="font-mono"
								onChange={(e) => setIban(e.target.value)}
								placeholder="DE00 0000 0000 0000 0000 00"
								value={iban}
							/>
						</Field>
						<Field>
							<FieldLabel>
								BIC
								<RequiredMark />
							</FieldLabel>
							<Input
								className="font-mono uppercase"
								onChange={(e) => setBic(e.target.value)}
								placeholder="ABCDDEFFXXX"
								value={bic}
							/>
							<FieldDescription>8 oder 11 Zeichen.</FieldDescription>
						</Field>
					</Section>

				<Section description="Laufzeit und Beiträge der Mitgliedschaft." title="Vertrag">
						<Field>
							<FieldLabel>
								Vertragsbeginn
								<RequiredMark />
							</FieldLabel>
							<Input
								onChange={(e) => setContractMonth(e.target.value)}
								type="month"
								value={contractMonth}
							/>
							<FieldDescription>Der Vertrag startet am 1. des Monats.</FieldDescription>
						</Field>
						<Field>
							<FieldLabel>
								Erstlaufzeit
								<RequiredMark />
							</FieldLabel>
							<Select
								items={INITIAL_PERIODS}
								onValueChange={(value) => setInitialPeriod(value as string)}
								value={initialPeriod}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectPopup>
									{INITIAL_PERIODS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectPopup>
							</Select>
						</Field>
						<Field>
							<FieldLabel>Aufnahmegebühr (€)</FieldLabel>
							<Input
								min="0"
								onChange={(e) => setJoiningFee(e.target.value)}
								placeholder="0,00"
								step="0.01"
								type="number"
								value={joiningFee}
							/>
						</Field>
						<Field>
							<FieldLabel>Jahresbeitrag (€)</FieldLabel>
							<Input
								min="0"
								onChange={(e) => setYearlyFee(e.target.value)}
								placeholder="0,00"
								step="0.01"
								type="number"
								value={yearlyFee}
							/>
						</Field>
						<Field>
							<FieldLabel>Abrechnung Jahresbeitrag</FieldLabel>
							<Select
								items={YEARLY_FEE_MODES}
								onValueChange={(value) => setYearlyFeeMode(value as string)}
								value={yearlyFeeMode}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectPopup>
									{YEARLY_FEE_MODES.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectPopup>
							</Select>
						</Field>
					</Section>

				<CardFrame>
						<CardFrameHeader>
							<CardFrameTitle>Gruppen</CardFrameTitle>
							<CardFrameDescription>
								Wähle Gruppen aus und passe bei Bedarf den Monatsbeitrag an.
							</CardFrameDescription>
						</CardFrameHeader>
						{groupsQuery.isPending ? (
							<Card>
								<CardPanel className="flex flex-col gap-3">
									{Array.from({ length: 3 }).map((_, i) => (
										<Skeleton className="h-9 w-full" key={"group-skeleton-" + i} />
									))}
								</CardPanel>
							</Card>
						) : groups.length === 0 ? (
							<Card>
								<CardPanel>
									<p className="text-muted-foreground text-sm">
										Noch keine Gruppen vorhanden. Du kannst sie unter „Gruppen" anlegen.
									</p>
								</CardPanel>
							</Card>
						) : (
							<Table variant="card">
								<TableHeader>
									<TableRow>
										<TableHead className="w-px" />
										<TableHead>Gruppe</TableHead>
										<TableHead className="w-44 text-right">Monatsbeitrag</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{groups.map((groupOption) => {
										const checked = selectedGroupIds.has(groupOption.id);
										const priceValue =
											groupPrices[groupOption.id] ??
											euroString(groupOption.defaultMembershipPriceCents ?? 0);
										return (
											<TableRow key={groupOption.id}>
												<TableCell className="w-px">
													<Checkbox
														aria-label={groupOption.name + " zuweisen"}
														checked={checked}
														onCheckedChange={() => toggleGroup(groupOption.id)}
													/>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2.5">
														<span
															aria-hidden="true"
															className="size-2.5 shrink-0 rounded-full"
															style={{ backgroundColor: groupOption.color }}
														/>
														<span className="font-medium text-foreground">
															{groupOption.name}
														</span>
													</div>
												</TableCell>
												<TableCell className="w-44">
													<div className="flex justify-end">
														<InputGroup className="w-32">
															<InputGroupAddon>€</InputGroupAddon>
															<InputGroupInput
																disabled={!checked}
																min="0"
																onChange={(e) =>
																	setGroupPrices((prev) => ({
																		...prev,
																		[groupOption.id]: e.target.value,
																	}))
																}
																step="0.01"
																type="number"
																value={priceValue}
															/>
														</InputGroup>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardFrame>

					<Section description="Interner Vermerk zum Mitglied." title="Notiz">
						<Field className="sm:col-span-2">
							<FieldLabel>Mitgliedsnotiz</FieldLabel>
							<Textarea
								onChange={(e) => setMemberNotes(e.target.value)}
								rows={4}
								value={memberNotes}
							/>
						</Field>
					</Section>

				<div className="flex items-center justify-end gap-3">
					<Button render={<Link to="/dashboard/members" />} type="button" variant="ghost">
						Abbrechen
					</Button>
					<Button disabled={!canSubmit} loading={createMutation.isPending} type="submit">
						Mitglied erstellen
					</Button>
				</div>
			</Form>
		</div>
	);
}
