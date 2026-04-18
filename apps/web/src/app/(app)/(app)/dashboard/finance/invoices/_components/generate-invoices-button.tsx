"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getNextMonthStart } from "@/utils/billing";
import { client, orpc } from "@/utils/orpc";

export function GenerateInvoicesButton() {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [targetMonth, setTargetMonth] = useState(getNextMonthStart());

	const generateMutation = useMutation({
		mutationFn: async () => {
			return client.billing.generateInvoices({
				targetMonth,
				currency: "EUR",
			});
		},
		onSuccess: (data) => {
			toast.success("Rechnungen generiert", {
				description: `${data.createdCount} Rechnungen für ${data.targetMonth} erstellt.`,
			});
			setOpen(false);
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listInvoices.queryKey({ input: {} }),
			});
		},
		onError: (error) => {
			toast.error("Fehler beim Generieren", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button />}>
				<Plus className="size-4" />
				Rechnungen generieren
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rechnungen generieren</DialogTitle>
					<DialogDescription>
						Erstellt Rechnungen für alle aktiven Verträge für den angegebenen
						Monat. Bereits existierende Rechnungen werden nicht dupliziert.
					</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="target-month"
								className="mb-2 block font-medium text-sm"
							>
								Zielmonat (1. des Monats)
							</label>
							<Input
								id="target-month"
								type="date"
								value={targetMonth}
								onChange={(e) => {
									// Ensure it's the 1st of the month
									const val = e.target.value;
									if (val) {
										const [year, month] = val.split("-");
										setTargetMonth(`${year}-${month}-01`);
									}
								}}
							/>
							<p className="mt-1 text-muted-foreground text-xs">
								Rechnungen werden für diesen Abrechnungsmonat erstellt.
							</p>
						</div>
						<div className="rounded-lg border bg-muted/50 p-3">
							<p className="font-medium text-sm">Hinweis</p>
							<p className="mt-1 text-muted-foreground text-sm">
								Das System berücksichtigt automatisch das{" "}
								<code className="rounded bg-muted px-1">settledThroughDate</code>{" "}
								der Verträge. Bereits abgerechnete Monate werden dabei nicht neu
								erstellt.
							</p>
						</div>
					</div>
				</DialogPanel>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Abbrechen
					</DialogClose>
					<Button
						onClick={() => generateMutation.mutate()}
						disabled={generateMutation.isPending || !targetMonth}
					>
						{generateMutation.isPending ? "Generiere..." : "Generieren"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
