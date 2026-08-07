"use client";

import { Button } from "@matdesk/ui/components/button";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
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
import { Textarea } from "@matdesk/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseError } from "evlog";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export type ProductForEdit = {
	id: string;
	name: string;
	description: string | null;
	attributes: { name: string; values: string[] }[];
};

type AttributeDraft = { id: string; name: string; valuesText: string };

const MAX_ATTRIBUTES = 8;

export function ProductSheet({
	open,
	onOpenChange,
	product,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product?: ProductForEdit | null;
}) {
	const queryClient = useQueryClient();
	const isEdit = Boolean(product);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [attributes, setAttributes] = useState<AttributeDraft[]>([]);

	useEffect(() => {
		if (!open) return;
		setName(product?.name ?? "");
		setDescription(product?.description ?? "");
		setAttributes(
			(product?.attributes ?? []).map((a) => ({
				id: crypto.randomUUID(),
				name: a.name,
				valuesText: a.values.join(", "),
			})),
		);
	}, [open, product]);

	function onDone(message: string) {
		toast.success(message);
		queryClient.invalidateQueries({ queryKey: orpc.inventory.list.key() });
		if (product) {
			queryClient.invalidateQueries({
				queryKey: orpc.inventory.get.key({ input: { productId: product.id } }),
			});
		}
		onOpenChange(false);
	}

	const createMutation = useMutation(
		orpc.inventory.create.mutationOptions({
			onSuccess: () => onDone("Produkt erstellt"),
			onError: (error) => toast.error(parseError(error).message),
		}),
	);
	const updateMutation = useMutation(
		orpc.inventory.update.mutationOptions({
			onSuccess: () => onDone("Produkt aktualisiert"),
			onError: (error) => toast.error(parseError(error).message),
		}),
	);
	const pending = createMutation.isPending || updateMutation.isPending;

	function addAttribute() {
		setAttributes((prev) =>
			prev.length >= MAX_ATTRIBUTES
				? prev
				: [...prev, { id: crypto.randomUUID(), name: "", valuesText: "" }],
		);
	}

	function updateAttribute(id: string, patch: Partial<Omit<AttributeDraft, "id">>) {
		setAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
	}

	function removeAttribute(id: string) {
		setAttributes((prev) => prev.filter((a) => a.id !== id));
	}

	function submit() {
		const cleaned = attributes
			.map((a) => ({
				name: a.name.trim(),
				values: a.valuesText
					.split(",")
					.map((v) => v.trim())
					.filter(Boolean),
			}))
			.filter((a) => a.name !== "" && a.values.length > 0);

		if (product) {
			updateMutation.mutate({
				productId: product.id,
				name: name.trim(),
				description: description.trim() || undefined,
				attributes: cleaned,
			});
		} else {
			createMutation.mutate({
				name: name.trim(),
				description: description.trim() || undefined,
				attributes: cleaned,
			});
		}
	}

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetPopup>
				<SheetHeader>
					<SheetTitle>{isEdit ? "Produkt bearbeiten" : "Produkt hinzufügen"}</SheetTitle>
					<SheetDescription>
						Merkmale wie Größe oder Farbe erzeugen automatisch alle Varianten.
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
							<FieldLabel>Name</FieldLabel>
							<Input
								onChange={(e) => setName(e.target.value)}
								placeholder="z. B. Vereins-T-Shirt"
								value={name}
							/>
						</Field>
						<Field>
							<FieldLabel>Beschreibung</FieldLabel>
							<Textarea
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional"
								rows={2}
								value={description}
							/>
						</Field>

						<Field className="gap-3">
							<div className="flex items-center justify-between">
								<FieldLabel>Merkmale</FieldLabel>
								<Button
									disabled={attributes.length >= MAX_ATTRIBUTES}
									onClick={addAttribute}
									size="sm"
									type="button"
									variant="outline"
								>
									<PlusIcon />
									Merkmal
								</Button>
							</div>
							{attributes.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									Keine Merkmale — das Produkt hat genau eine Variante.
								</p>
							) : (
								attributes.map((attribute) => (
									<div className="flex items-start gap-2" key={attribute.id}>
										<div className="grid flex-1 gap-2">
											<Input
												onChange={(e) => updateAttribute(attribute.id, { name: e.target.value })}
												placeholder="Merkmal (z. B. Größe)"
												value={attribute.name}
											/>
											<Input
												onChange={(e) =>
													updateAttribute(attribute.id, { valuesText: e.target.value })
												}
												placeholder="Werte, kommagetrennt (S, M, L)"
												value={attribute.valuesText}
											/>
										</div>
										<Button
											aria-label="Merkmal entfernen"
											className="mt-0.5"
											onClick={() => removeAttribute(attribute.id)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<XIcon />
										</Button>
									</div>
								))
							)}
							{isEdit ? (
								<FieldDescription>
									Änderungen an Merkmalen erzeugen die Varianten neu. Bestände bestehender
									Kombinationen bleiben erhalten.
								</FieldDescription>
							) : null}
						</Field>
					</SheetPanel>
					<SheetFooter>
						<SheetClose render={<Button variant="ghost" />}>Abbrechen</SheetClose>
						<Button disabled={!name.trim()} loading={pending} type="submit">
							{isEdit ? "Speichern" : "Erstellen"}
						</Button>
					</SheetFooter>
				</Form>
			</SheetPopup>
		</Sheet>
	);
}
