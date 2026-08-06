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
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@matdesk/ui/components/select";
import { useMutation } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

type UserRole = "user" | "admin";

export function CreateUserDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<UserRole>("user");

	const mutation = useMutation({
		mutationFn: async () => {
			const { data, error } = await authClient.admin.createUser({
				name,
				email,
				password,
				role,
			});
			if (error) throw new Error(error.message);
			return data;
		},
		onSuccess: () => {
			toast.success("Benutzer erstellt");
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			onOpenChange(false);
			setName("");
			setEmail("");
			setPassword("");
			setRole("user");
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogPopup className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Benutzer erstellen</DialogTitle>
					<DialogDescription>Lege einen neuen Plattform-Benutzer an.</DialogDescription>
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
							<FieldLabel>Name</FieldLabel>
							<Input onChange={(e) => setName(e.target.value)} value={name} />
						</Field>
						<Field>
							<FieldLabel>E-Mail</FieldLabel>
							<Input onChange={(e) => setEmail(e.target.value)} type="email" value={email} />
						</Field>
						<Field>
							<FieldLabel>Passwort</FieldLabel>
							<Input
								onChange={(e) => setPassword(e.target.value)}
								type="password"
								value={password}
							/>
						</Field>
						<Field>
							<FieldLabel>Rolle</FieldLabel>
							<Select
								items={[
									{ label: "Benutzer", value: "user" },
									{ label: "Admin", value: "admin" },
								]}
								onValueChange={(value) => setRole(value as UserRole)}
								value={role}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectPopup>
									<SelectItem value="user">Benutzer</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectPopup>
							</Select>
						</Field>
					</DialogPanel>
					<DialogFooter>
						<DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
						<Button
							disabled={!name || !email || password.length < 8}
							loading={mutation.isPending}
							type="submit"
						>
							Erstellen
						</Button>
					</DialogFooter>
				</Form>
			</DialogPopup>
		</Dialog>
	);
}
