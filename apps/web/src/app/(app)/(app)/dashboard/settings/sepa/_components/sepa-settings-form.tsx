"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CircleQuestionMarkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardFrame,
	CardFrameAction,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";
import { SepaTransactionDetails } from "./sepa-transaction-details";

type SepaSettingsFormState = {
	creditorName: string;
	creditorIban: string;
	creditorBic: string;
	creditorId: string;
	initiatorName: string;
	batchBooking: boolean;
	membershipTemplate: string;
	joiningFeeTemplate: string;
	yearlyFeeTemplate: string;
};

type SepaSettingsFormProps = {
	initialFormState: SepaSettingsFormState;
};

const transactionDocsUrl =
	"https://docs.matdesk.app/docs/settings/sepa#transaktionsdetails";

const normalizeBankValue = (value: string) =>
	value.replace(/\s+/g, "").toUpperCase();

const isValidIban = (value: string) => /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(value);

export function SepaSettingsForm({
	initialFormState,
}: SepaSettingsFormProps) {
	const router = useRouter();
	const [formState, setFormState] = useState(initialFormState);

	useEffect(() => {
		setFormState(initialFormState);
	}, [initialFormState]);

	const isSepaComplete = !!(
		formState.creditorName &&
		formState.creditorIban &&
		formState.creditorBic &&
		formState.creditorId
	);

	const updateMutation = useMutation(
		orpc.organizations.updateSettings.mutationOptions({
			onSuccess: () => {
				toast.success("SEPA-Einstellungen aktualisiert");
				router.refresh();
			},
			onError: (error: any) => {
				toast.error("SEPA-Einstellungen konnten nicht aktualisiert werden", {
					description:
						error instanceof Error ? error.message : "Bitte versuche es erneut.",
				});
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const normalizedIban = formState.creditorIban
			? normalizeBankValue(formState.creditorIban)
			: "";
		const normalizedBic = formState.creditorBic
			? normalizeBankValue(formState.creditorBic)
			: "";
		const normalizedCreditorId = formState.creditorId
			? normalizeBankValue(formState.creditorId)
			: "";

		if (normalizedIban && !isValidIban(normalizedIban)) {
			toast.error("Ungültige IBAN", {
				description: "Bitte gib eine gültige IBAN ein.",
			});
			return;
		}

		updateMutation.mutate({
			creditorName: formState.creditorName || undefined,
			creditorIban: normalizedIban || undefined,
			creditorBic: normalizedBic || undefined,
			creditorId: normalizedCreditorId || undefined,
			initiatorName: formState.initiatorName || undefined,
			batchBooking: formState.batchBooking,
			remittanceTemplates: {
				membership: formState.membershipTemplate || undefined,
				joiningFee: formState.joiningFeeTemplate || undefined,
				yearlyFee: formState.yearlyFeeTemplate || undefined,
			},
		});
	};

	return (
		<div className="space-y-6">
			{!isSepaComplete ? (
				<Alert variant="warning">
					<AlertTriangle />
					<AlertTitle>SEPA-Informationen vervollständigen</AlertTitle>
					<AlertDescription>
						Füge Gläubigername, IBAN, BIC und Gläubiger-ID hinzu, um
						SEPA-Exporte zu aktivieren.
					</AlertDescription>
				</Alert>
			) : null}

			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Bankverbindung</CardFrameTitle>
					<CardFrameDescription>
						Gib deine Kontoinformationen für das SEPA-Lastschriftverfahren ein
					</CardFrameDescription>
					<CardFrameAction>
						<Button
							size="xs"
							variant="outline"
							render={
								<a
									href={transactionDocsUrl}
									target="_blank"
									rel="noreferrer noopener"
								/>
							}
						>
							<CircleQuestionMarkIcon data-icon="inline-start" />
							Docs
						</Button>
					</CardFrameAction>
				</CardFrameHeader>
				<Card>
					<CardPanel>
						<form
							id="sepa-bank-form"
							onSubmit={handleSubmit}
							className="space-y-4"
						>
							<Field>
								<FieldLabel>Gläubigername</FieldLabel>
								<Input
									placeholder="Beispiel GmbH"
									type="text"
									value={formState.creditorName}
									disabled={updateMutation.isPending}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											creditorName: e.target.value,
										}))
									}
								/>
							</Field>
							<Field>
								<FieldLabel>IBAN</FieldLabel>
								<Input
									placeholder="DE89370400440532013000"
									type="text"
									maxLength={34}
									value={formState.creditorIban}
									disabled={updateMutation.isPending}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											creditorIban: e.target.value,
										}))
									}
								/>
							</Field>
							<Field>
								<FieldLabel>BIC</FieldLabel>
								<Input
									placeholder="COBADEFFXXX"
									type="text"
									maxLength={11}
									value={formState.creditorBic}
									disabled={updateMutation.isPending}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											creditorBic: e.target.value,
										}))
									}
								/>
							</Field>
							<Field>
								<FieldLabel>Gläubiger-ID</FieldLabel>
								<Input
									placeholder="DE98ZZZ09999999999"
									type="text"
									value={formState.creditorId}
									disabled={updateMutation.isPending}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											creditorId: e.target.value,
										}))
									}
								/>
							</Field>
							<Field>
								<FieldLabel>Name des Initiators (optional)</FieldLabel>
								<Input
									placeholder="Beispiel GmbH"
									type="text"
									value={formState.initiatorName}
									disabled={updateMutation.isPending}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											initiatorName: e.target.value,
										}))
									}
								/>
							</Field>
							<Field>
								<FieldLabel>Sammelbuchung</FieldLabel>
								<div className="flex items-center gap-3">
									<Checkbox
										checked={formState.batchBooking}
										disabled={updateMutation.isPending}
										onCheckedChange={(value) =>
											setFormState((prev) => ({
												...prev,
												batchBooking: Boolean(value),
											}))
										}
									/>
									<span className="text-muted-foreground text-sm">
										Transaktionen als Sammelbuchung zusammenfassen
									</span>
								</div>
							</Field>
							<div className="flex justify-end gap-2">
								<Button
									type="reset"
									variant="ghost"
									onClick={() => setFormState(initialFormState)}
									disabled={updateMutation.isPending}
								>
									Zurücksetzen
								</Button>
								<Button
									type="submit"
									disabled={updateMutation.isPending}
								>
									{updateMutation.isPending
										? "Speichern..."
										: "Änderungen speichern"}
								</Button>
							</div>
						</form>
					</CardPanel>
				</Card>
			</CardFrame>

			<SepaTransactionDetails
				formState={{
					membershipTemplate: formState.membershipTemplate,
					joiningFeeTemplate: formState.joiningFeeTemplate,
					yearlyFeeTemplate: formState.yearlyFeeTemplate,
				}}
				setFormState={(updater) =>
					setFormState((prev) => {
						const current = {
							membershipTemplate: prev.membershipTemplate,
							joiningFeeTemplate: prev.joiningFeeTemplate,
							yearlyFeeTemplate: prev.yearlyFeeTemplate,
						};
						const next =
							typeof updater === "function" ? updater(current) : updater;

						return {
							...prev,
							membershipTemplate: next.membershipTemplate,
							joiningFeeTemplate: next.joiningFeeTemplate,
							yearlyFeeTemplate: next.yearlyFeeTemplate,
						};
					})
				}
				isLoading={false}
				isSaving={updateMutation.isPending}
				onSubmit={handleSubmit}
				docsHref={transactionDocsUrl}
			/>
		</div>
	);
}
