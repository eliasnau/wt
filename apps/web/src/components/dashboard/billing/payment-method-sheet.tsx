"use client";

import { Button } from "@matdesk/ui/components/button";
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import {
	Sheet,
	SheetClose,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
} from "@matdesk/ui/components/sheet";
import { useState } from "react";

export function PaymentMethodSheet({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [name, setName] = useState("");
	const [number, setNumber] = useState("");
	const [expiry, setExpiry] = useState("");
	const [cvc, setCvc] = useState("");

	const canSubmit =
		name.trim() !== "" && number.trim() !== "" && expiry.trim() !== "" && cvc.trim() !== "";

	function submit() {
		// No billing provider connected yet — close without persisting.
		onOpenChange(false);
	}

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetPopup>
				<SheetHeader>
					<SheetTitle>Zahlungsmethode hinzufügen</SheetTitle>
					<SheetDescription>
						Hinterlege eine Karte für die monatliche Abrechnung.
					</SheetDescription>
				</SheetHeader>
				<Form
					className="contents"
					onSubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					<SheetPanel className="flex flex-col gap-4">
						<Field>
							<FieldLabel>Karteninhaber</FieldLabel>
							<Input
								autoComplete="cc-name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Max Mustermann"
								value={name}
							/>
						</Field>
						<Field>
							<FieldLabel>Kartennummer</FieldLabel>
							<Input
								autoComplete="cc-number"
								className="font-mono"
								inputMode="numeric"
								onChange={(e) => setNumber(e.target.value)}
								placeholder="1234 5678 9012 3456"
								value={number}
							/>
						</Field>
						<div className="grid grid-cols-2 gap-4">
							<Field>
								<FieldLabel>Ablauf</FieldLabel>
								<Input
									autoComplete="cc-exp"
									className="font-mono"
									onChange={(e) => setExpiry(e.target.value)}
									placeholder="MM/JJ"
									value={expiry}
								/>
							</Field>
							<Field>
								<FieldLabel>Prüfnummer</FieldLabel>
								<Input
									autoComplete="cc-csc"
									className="font-mono"
									inputMode="numeric"
									onChange={(e) => setCvc(e.target.value)}
									placeholder="CVC"
									value={cvc}
								/>
							</Field>
						</div>
					</SheetPanel>
					<SheetFooter>
						<SheetClose render={<Button variant="ghost" />}>Abbrechen</SheetClose>
						<Button disabled={!canSubmit} type="submit">
							Hinzufügen
						</Button>
					</SheetFooter>
				</Form>
			</SheetPopup>
		</Sheet>
	);
}
