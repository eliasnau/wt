"use client";

import { authClient } from "@repo/auth/client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ProfileFrameProps {
	initialName: string;
	initialEmail: string;
}

export function ProfileFrame({ initialName, initialEmail }: ProfileFrameProps) {
	const { session } = useAuth();
	const [currentName, setCurrentName] = useState(initialName);
	const [currentEmail] = useState(initialEmail);
	const [nameDialogOpen, setNameDialogOpen] = useState(false);
	const [emailDialogOpen, setEmailDialogOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [isUpdatingName, setIsUpdatingName] = useState(false);
	const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
	const hideSensitiveInformatoin = Boolean(
		session?.user?.hideSensitiveInformatoin,
	);
	type AuthCallbackContext = { error: { message?: string } };

	const handleUpdateName = async () => {
		if (!newName.trim()) {
			toast.error("Name darf nicht leer sein");
			return;
		}

		setIsUpdatingName(true);

		try {
			await authClient.updateUser(
				{ name: newName.trim() },
				{
					onSuccess: () => {
						toast.success("Name erfolgreich aktualisiert");
						setCurrentName(newName.trim());
						setNameDialogOpen(false);
						setNewName("");
					},
					onError: (context: AuthCallbackContext) => {
						toast.error(
							context.error.message ||
								"Aktualisierung des Namens fehlgeschlagen",
						);
					},
				},
			);
			setIsUpdatingName(false);
		} catch (error) {
			toast.error("Aktualisierung des Namens fehlgeschlagen");
			console.error(error);
			setIsUpdatingName(false);
		}
	};

	const handleUpdateEmail = async () => {
		if (!newEmail.trim()) {
			toast.error("E-Mail darf nicht leer sein");
			return;
		}

		setIsUpdatingEmail(true);
		try {
			await authClient.changeEmail(
				{ newEmail: newEmail.trim() },
				{
					onSuccess: () => {
						toast.success("Bestätigungs-E-Mail gesendet", {
							description:
								"Prüfe deinen Posteingang, um die neue E-Mail-Adresse zu bestätigen.",
						});

						setEmailDialogOpen(false);
						setNewEmail("");
					},
					onError: (context: AuthCallbackContext) => {
						toast.error(
							context.error.message || "Änderung der E-Mail fehlgeschlagen",
						);
					},
				},
			);
			setIsUpdatingEmail(false);
		} catch (error) {
			toast.error("Änderung der E-Mail fehlgeschlagen");
			console.error(error);
			setIsUpdatingEmail(false);
		}
	};

	return (
		<>
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Profilinformationen
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Aktualisiere deine persönlichen Informationen und deine
						E-Mail-Adresse.
					</p>
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="mb-1 font-medium text-muted-foreground text-sm">
									Anzeigename
								</p>
								<p
									className={cn(
										"text-base text-foreground",
										hideSensitiveInformatoin && "select-none blur-sm",
									)}
								>
									{currentName}
								</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setNewName(currentName);
									setNameDialogOpen(true);
								}}
							>
								Change
							</Button>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<p className="mb-1 font-medium text-muted-foreground text-sm">
									E-Mail-Adresse
								</p>
								<p
									className={cn(
										"text-base text-foreground",
										hideSensitiveInformatoin && "select-none blur-sm",
									)}
								>
									{currentEmail}
								</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setNewEmail(currentEmail);
									setEmailDialogOpen(true);
								}}
							>
								Change
							</Button>
						</div>
					</div>
				</FramePanel>
			</Frame>

			<Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Anzeigenamen ändern</DialogTitle>
					</DialogHeader>
					<DialogPanel>
						<Field>
							<FieldLabel>Anzeigename</FieldLabel>
							<Input
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="Gib deinen Namen ein"
								autoFocus
							/>
						</Field>
					</DialogPanel>
					<DialogFooter>
						<DialogClose
							render={<Button variant="ghost" />}
							disabled={isUpdatingName}
						>
							Cancel
						</DialogClose>
						<Button
							onClick={handleUpdateName}
							disabled={
								isUpdatingName ||
								!newName.trim() ||
								newName.trim() === currentName
							}
						>
							{isUpdatingName ? (
								<>
									<Spinner />
									Saving...
								</>
							) : (
								"Änderungen speichern"
							)}
						</Button>
					</DialogFooter>
				</DialogPopup>
			</Dialog>

			<Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>E-Mail-Adresse ändern</DialogTitle>
					</DialogHeader>
					<DialogPanel>
						<Field>
							<FieldLabel>E-Mail-Adresse</FieldLabel>
							<Input
								type="email"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								placeholder="Gib deine E-Mail-Adresse ein"
								autoFocus
							/>
							<p className="mt-2 text-muted-foreground text-xs">
								A verification email will be sent to the new address
							</p>
						</Field>
					</DialogPanel>
					<DialogFooter>
						<DialogClose
							render={<Button variant="ghost" />}
							disabled={isUpdatingEmail}
						>
							Cancel
						</DialogClose>
						<Button
							onClick={handleUpdateEmail}
							disabled={
								isUpdatingEmail ||
								!newEmail.trim() ||
								newEmail.trim() === currentEmail
							}
						>
							{isUpdatingEmail ? (
								<>
									<Spinner />
									Saving...
								</>
							) : (
								"Änderungen speichern"
							)}
						</Button>
					</DialogFooter>
				</DialogPopup>
			</Dialog>
		</>
	);
}
