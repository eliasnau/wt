"use client";

import { Button } from "@matdesk/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@matdesk/ui/components/dialog";
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function CreateOrgDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugTouched, setSlugTouched] = useState(false);

	const mutation = useMutation(
		orpc.admin.organizations.create.mutationOptions({
			onSuccess: () => {
				toast.success("Organisation erstellt");
				queryClient.invalidateQueries({ queryKey: orpc.admin.organizations.key() });
				onOpenChange(false);
				setName("");
				setSlug("");
				setSlugTouched(false);
			},
			onError: (error) => toast.error(parseError(error).message),
		}),
	);

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogPopup className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Organisation erstellen</DialogTitle>
					<DialogDescription>Lege eine neue Organisation an.</DialogDescription>
				</DialogHeader>
				<Form
					className="contents"
					onSubmit={(e) => {
						e.preventDefault();
						mutation.mutate({ name, slug: slug || slugify(name) });
					}}
				>
					<DialogPanel className="grid gap-4">
						<Field>
							<FieldLabel>Name</FieldLabel>
							<Input
								onChange={(e) => {
									setName(e.target.value);
									if (!slugTouched) setSlug(slugify(e.target.value));
								}}
								placeholder="Acme Sportverein"
								value={name}
							/>
						</Field>
						<Field>
							<FieldLabel>Slug</FieldLabel>
							<Input
								onChange={(e) => {
									setSlugTouched(true);
									setSlug(slugify(e.target.value));
								}}
								placeholder="acme-sportverein"
								value={slug}
							/>
						</Field>
					</DialogPanel>
					<DialogFooter>
						<DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
						<Button disabled={!name || !slug} loading={mutation.isPending} type="submit">
							Erstellen
						</Button>
					</DialogFooter>
				</Form>
			</DialogPopup>
		</Dialog>
	);
}
