"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { parseMembershipPriceInput } from "@/utils/membership-price";
import { client, orpc } from "@/utils/orpc";

interface UpdateMemberContractSheetProps {
	memberId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialValues: {
		joiningFeeAmount: string;
		yearlyFeeAmount: string;
	};
}

function parseAmountInputToCents(value: string) {
	if (value.trim() === "") {
		return 0;
	}

	const parsedAmount = parseMembershipPriceInput(value);
	if (parsedAmount === null) {
		return undefined;
	}

	return Math.round(parsedAmount * 100);
}

export function UpdateMemberContractSheet({
	memberId,
	open,
	onOpenChange,
	initialValues,
}: UpdateMemberContractSheetProps) {
	const queryClient = useQueryClient();
	const [joiningFeeAmount, setJoiningFeeAmount] = useState("");
	const [yearlyFeeAmount, setYearlyFeeAmount] = useState("");

	useEffect(() => {
		if (!open) return;
		setJoiningFeeAmount(initialValues.joiningFeeAmount);
		setYearlyFeeAmount(initialValues.yearlyFeeAmount);
	}, [initialValues, open]);

	const updateMutation = useMutation({
		mutationFn: async () =>
			client.members.updateMemberContract({
				memberId,
				joiningFeeCents: parseAmountInputToCents(joiningFeeAmount),
				yearlyFeeCents: parseAmountInputToCents(yearlyFeeAmount),
			}),
		onSuccess: async () => {
			toast.success("Vertragsdaten aktualisiert");
			onOpenChange(false);
			await queryClient.invalidateQueries({
				queryKey: orpc.members.get.queryKey({
					input: { memberId },
				}),
			});
		},
		onError: (error) => {
			toast.error("Vertragsdaten konnten nicht gespeichert werden", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const parsedJoiningFee =
		joiningFeeAmount.trim() === ""
			? 0
			: parseMembershipPriceInput(joiningFeeAmount);
	const parsedYearlyFee =
		yearlyFeeAmount.trim() === ""
			? 0
			: parseMembershipPriceInput(yearlyFeeAmount);
	const isValid = parsedJoiningFee !== null && parsedYearlyFee !== null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Vertragsdaten bearbeiten</SheetTitle>
					<SheetDescription>
						Aktualisiere die Gebühren des aktuellen Vertrags.
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-5">
						<div className="space-y-2">
							<label htmlFor="contract-joining-fee" className="block font-medium text-sm">
								Aufnahmegebühr
							</label>
							<Input
								id="contract-joining-fee"
								value={joiningFeeAmount}
								onChange={(event) => setJoiningFeeAmount(event.target.value)}
								placeholder="0,00"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="contract-yearly-fee" className="block font-medium text-sm">
								Jahresbeitrag
							</label>
							<Input
								id="contract-yearly-fee"
								value={yearlyFeeAmount}
								onChange={(event) => setYearlyFeeAmount(event.target.value)}
								placeholder="0,00"
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
