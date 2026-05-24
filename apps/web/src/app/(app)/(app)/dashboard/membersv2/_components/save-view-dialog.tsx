"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface SaveViewDialogProps {
	open: boolean;
	mode: "save" | "rename";
	initialName: string;
	onOpenChange: (open: boolean) => void;
	onSubmit: (name: string) => void;
}

export function SaveViewDialog({
	open,
	mode,
	initialName,
	onOpenChange,
	onSubmit,
}: SaveViewDialogProps) {
	const [name, setName] = useState(initialName);

	useEffect(() => {
		if (open) {
			setName(initialName);
		}
	}, [open, initialName]);

	const title = mode === "save" ? "Ansicht speichern" : "Ansicht umbenennen";
	const description =
		mode === "save"
			? "Gib dieser Ansicht einen Namen, um die aktuellen Filter zu speichern."
			: "Wähle einen neuen Namen für diese Ansicht.";
	const submitLabel = mode === "save" ? "Speichern" : "Umbenennen";

	const handleSubmit = () => {
		const trimmed = name.trim();
		if (!trimmed) {
			return;
		}
		onSubmit(trimmed);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							handleSubmit();
						}}
					>
						<Field>
							<FieldLabel htmlFor="saved-view-name">Name</FieldLabel>
							<Input
								id="saved-view-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Name der Ansicht"
							/>
						</Field>
					</form>
				</DialogPanel>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Abbrechen
					</Button>
					<Button disabled={!name.trim()} onClick={handleSubmit}>
						{submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
