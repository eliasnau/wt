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

import { authClient } from "@/lib/auth-client";

export function ResetPasswordDialog({
	userId,
	open,
	onOpenChange,
}: {
	userId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [password, setPassword] = useState("");

	const mutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.admin.setUserPassword({
				userId,
				newPassword: password,
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("Passwort aktualisiert");
			onOpenChange(false);
			setPassword("");
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogPopup className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Passwort zurücksetzen</DialogTitle>
					<DialogDescription>Lege ein neues Passwort für diesen Benutzer fest.</DialogDescription>
				</DialogHeader>
				<Form
					className="contents"
					onSubmit={(e) => {
						e.preventDefault();
						mutation.mutate();
					}}
				>
					<DialogPanel className="grid gap-4">
						<Field>
							<FieldLabel>Neues Passwort</FieldLabel>
							<Input
								onChange={(e) => setPassword(e.target.value)}
								type="password"
								value={password}
							/>
						</Field>
					</DialogPanel>
					<DialogFooter>
						<DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
						<Button disabled={password.length < 8} loading={mutation.isPending} type="submit">
							Speichern
						</Button>
					</DialogFooter>
				</Form>
			</DialogPopup>
		</Dialog>
	);
}
