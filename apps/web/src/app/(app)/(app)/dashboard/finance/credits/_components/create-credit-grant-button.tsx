"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc } from "@/utils/orpc";

interface CreateCreditGrantButtonProps {
	memberId: string;
	contractId: string;
	memberName?: string;
}

type CreditGrantType = "money" | "billing_cycles";

export function CreateCreditGrantButton({
	memberId,
	contractId,
	memberName,
}: CreateCreditGrantButtonProps) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);

	// Form state
	const [type, setType] = useState<CreditGrantType>("money");
	const [description, setDescription] = useState("");
	const [notes, setNotes] = useState("");
	const [validFrom, setValidFrom] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [amountEuros, setAmountEuros] = useState("");
	const [cycles, setCycles] = useState("");

	const resetForm = () => {
		setType("money");
		setDescription("");
		setNotes("");
		setValidFrom("");
		setExpiresAt("");
		setAmountEuros("");
		setCycles("");
	};

	const createMutation = useMutation({
		mutationFn: async () => {
			const input: {
				memberId: string;
				contractId: string;
				type: CreditGrantType;
				description?: string;
				notes?: string;
				validFrom?: string;
				expiresAt?: string;
				originalAmountCents?: number;
				originalCycles?: number;
			} = {
				memberId,
				contractId,
				type,
			};

			if (description) input.description = description;
			if (notes) input.notes = notes;
			if (validFrom) input.validFrom = validFrom;
			if (expiresAt) input.expiresAt = expiresAt;

			if (type === "money") {
				const cents = Math.round(Number.parseFloat(amountEuros) * 100);
				if (Number.isNaN(cents) || cents <= 0) {
					throw new Error("Bitte geben Sie einen gültigen Betrag ein");
				}
				input.originalAmountCents = cents;
			} else {
				const cycleCount = Number.parseInt(cycles, 10);
				if (Number.isNaN(cycleCount) || cycleCount <= 0) {
					throw new Error("Bitte geben Sie eine gültige Anzahl an Monaten ein");
				}
				input.originalCycles = cycleCount;
			}

			return client.billing.createCreditGrant(input);
		},
		onSuccess: () => {
			toast.success("Guthaben erstellt");
			setOpen(false);
			resetForm();
			queryClient.invalidateQueries({
				queryKey: orpc.billing.listCreditGrants.queryKey({ input: {} }),
			});
		},
		onError: (error) => {
			toast.error("Fehler beim Erstellen", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const isValid =
		type === "money"
			? amountEuros && Number.parseFloat(amountEuros) > 0
			: cycles && Number.parseInt(cycles, 10) > 0;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="outline" size="sm">
						<Gift className="size-4" />
						Guthaben hinzufügen
					</Button>
				}
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Guthaben hinzufügen</DialogTitle>
					<DialogDescription>
						{memberName
							? `Erstellen Sie ein neues Guthaben für ${memberName}.`
							: "Erstellen Sie ein neues Guthaben für diesen Vertrag."}
					</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					<div className="space-y-4">
						{/* Type selection */}
						<div>
							<label
								htmlFor="credit-type"
								className="mb-2 block font-medium text-sm"
							>
								Typ
							</label>
							<Select
								value={type}
								onValueChange={(v) => setType(v as CreditGrantType)}
							>
								<SelectTrigger id="credit-type">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="money">Guthaben (Euro)</SelectItem>
									<SelectItem value="billing_cycles">Freie Monate</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Amount/Cycles based on type */}
						{type === "money" ? (
							<div>
								<label
									htmlFor="amount"
									className="mb-2 block font-medium text-sm"
								>
									Betrag (EUR)
								</label>
								<Input
									id="amount"
									type="number"
									min="0.01"
									step="0.01"
									placeholder="10.00"
									value={amountEuros}
									onChange={(e) => setAmountEuros(e.target.value)}
								/>
								<p className="mt-1 text-muted-foreground text-xs">
									Der Betrag wird von zukünftigen Rechnungen abgezogen.
								</p>
							</div>
						) : (
							<div>
								<label
									htmlFor="cycles"
									className="mb-2 block font-medium text-sm"
								>
									Anzahl freie Monate
								</label>
								<Input
									id="cycles"
									type="number"
									min="1"
									step="1"
									placeholder="1"
									value={cycles}
									onChange={(e) => setCycles(e.target.value)}
								/>
								<p className="mt-1 text-muted-foreground text-xs">
									Mitgliedsbeiträge werden für diese Anzahl Monate erlassen.
								</p>
							</div>
						)}

						{/* Description */}
						<div>
							<label
								htmlFor="description"
								className="mb-2 block font-medium text-sm"
							>
								Beschreibung (optional)
							</label>
							<Input
								id="description"
								type="text"
								placeholder="z.B. Werbeaktion, Kulanz, Korrektur..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						{/* Validity dates */}
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label
									htmlFor="valid-from"
									className="mb-2 block font-medium text-sm"
								>
									Gültig ab (optional)
								</label>
								<Input
									id="valid-from"
									type="date"
									value={validFrom}
									onChange={(e) => setValidFrom(e.target.value)}
								/>
							</div>
							<div>
								<label
									htmlFor="expires-at"
									className="mb-2 block font-medium text-sm"
								>
									Gültig bis (optional)
								</label>
								<Input
									id="expires-at"
									type="date"
									value={expiresAt}
									onChange={(e) => setExpiresAt(e.target.value)}
								/>
							</div>
						</div>

						{/* Notes */}
						<div>
							<label htmlFor="notes" className="mb-2 block font-medium text-sm">
								Interne Notizen (optional)
							</label>
							<Textarea
								id="notes"
								placeholder="Interne Notizen zum Guthaben..."
								rows={3}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>
					</div>
				</DialogPanel>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Abbrechen
					</DialogClose>
					<Button
						onClick={() => createMutation.mutate()}
						disabled={createMutation.isPending || !isValid}
					>
						{createMutation.isPending ? "Erstelle..." : "Erstellen"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
