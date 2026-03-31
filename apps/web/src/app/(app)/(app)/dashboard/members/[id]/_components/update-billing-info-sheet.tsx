"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import { client, orpc } from "@/utils/orpc";

interface UpdateBillingInfoSheetProps {
	memberId: string;
	contractId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialValues?: {
		accountHolder: string;
		iban: string;
		bic: string;
	};
}

export function UpdateBillingInfoSheet({
	memberId,
	contractId,
	open,
	onOpenChange,
	initialValues,
}: UpdateBillingInfoSheetProps) {
	const queryClient = useQueryClient();
	const [accountHolder, setAccountHolder] = useState("");
	const [iban, setIban] = useState("");
	const [bic, setBic] = useState("");

	useEffect(() => {
		if (!open) return;
		setAccountHolder(initialValues?.accountHolder ?? "");
		setIban(initialValues?.iban ?? "");
		setBic(initialValues?.bic ?? "");
	}, [initialValues, open]);

	const updateMutation = useMutation({
		mutationFn: async () =>
			client.members.updateBillingInfo({
				memberId,
				accountHolder,
				iban,
				bic,
			}),
		onSuccess: async () => {
			toast.success("Zahlungsdaten aktualisiert");
			onOpenChange(false);
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: orpc.billing.listSepaMandates.queryKey({
						input: { contractId },
					}),
				}),
				queryClient.invalidateQueries({
					queryKey: orpc.members.get.queryKey({
						input: { memberId },
					}),
				}),
			]);
		},
		onError: (error) => {
			toast.error("Zahlungsdaten konnten nicht gespeichert werden", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const isValid =
		accountHolder.trim().length > 0 &&
		iban.trim().length > 0 &&
		bic.trim().length > 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Zahlungsdaten bearbeiten</SheetTitle>
					<SheetDescription>
						Aktualisiere das Konto, das für zukünftige Lastschriften verwendet
						wird.
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-5">
						<Alert variant="info">
							<CircleAlert className="size-4" />
							<AlertTitle>Was passiert beim Speichern?</AlertTitle>
							<AlertDescription>
								Für zukünftige Abbuchungen werden die neuen Zahlungsdaten
								verwendet. Bereits erzeugte Lastschriften bleiben unverändert.
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<label
								htmlFor="billing-account-holder"
								className="block font-medium text-sm"
							>
								Kontoinhaber
							</label>
							<Input
								id="billing-account-holder"
								value={accountHolder}
								onChange={(event) => setAccountHolder(event.target.value)}
								placeholder="Max Mustermann"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="billing-iban" className="block font-medium text-sm">
								IBAN
							</label>
							<Input
								id="billing-iban"
								value={iban}
								onChange={(event) => setIban(event.target.value)}
								placeholder="DE12 3456 7890 1234 5678 90"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="billing-bic" className="block font-medium text-sm">
								BIC
							</label>
							<Input
								id="billing-bic"
								value={bic}
								onChange={(event) => setBic(event.target.value)}
								placeholder="GENODEF1S01"
							/>
						</div>
					</div>
				</SheetPanel>
				<SheetFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={updateMutation.isPending}
					>
						Abbrechen
					</Button>
					<Button
						onClick={() => updateMutation.mutate()}
						disabled={!isValid || updateMutation.isPending}
					>
						{updateMutation.isPending ? "Speichere..." : "Speichern"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
