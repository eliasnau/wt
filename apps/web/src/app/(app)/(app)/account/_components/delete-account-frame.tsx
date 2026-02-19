"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";

export function DeleteAccountFrame() {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteAccount = async () => {
		setIsDeleting(true);

		try {
			await authClient.deleteUser();
			toast.success("Konto erfolgreich gelöscht");

			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						window.location.href = "/";
					},
				},
			});
		} catch (error) {
			toast.error("Konto konnte nicht gelöscht werden");
			console.error(error);
			setIsDeleting(false);
		}
	};

	return (
		<Frame className="relative flex min-w-0 flex-1 flex-col border-destructive/50 bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				<h2 className="mb-2 font-heading text-destructive text-xl">
					Gefahrenbereich
				</h2>
				<p className="text-muted-foreground text-sm">
					Lösche dein Konto und alle zugehörigen Daten dauerhaft. Diese Aktion
					kann nicht rückgängig gemacht werden und du verlierst den Zugriff auf
					alle deine Daten.
				</p>
			</FramePanel>
			<FrameFooter className="flex-row justify-end gap-2">
				<AlertDialog>
					<AlertDialogTrigger
						render={<Button variant="destructive" />}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Konto wird gelöscht...
							</>
						) : (
							"Mein Konto löschen"
						)}
					</AlertDialogTrigger>
					<AlertDialogPopup>
						<AlertDialogHeader>
							<AlertDialogTitle>Bist du dir absolut sicher?</AlertDialogTitle>
							<AlertDialogDescription>
								Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird
								dein Konto dauerhaft gelöscht und alle deine Daten von unseren
								Servern entfernt, einschließlich:
								<ul className="mt-2 list-inside list-disc space-y-1">
									<li>Dein Profil und persönliche Informationen</li>
									<li>Alle Organisationen, die dir gehören</li>
									<li>Alle Projekte und zugehörigen Daten</li>
									<li>Dein Zugriff auf geteilte Ressourcen</li>
								</ul>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogClose render={<Button variant="ghost" />}>
								Cancel
							</AlertDialogClose>
							<AlertDialogClose
								render={<Button variant="destructive" />}
								onClick={handleDeleteAccount}
							>
								Ja, mein Konto löschen
							</AlertDialogClose>
						</AlertDialogFooter>
					</AlertDialogPopup>
				</AlertDialog>
			</FrameFooter>
		</Frame>
	);
}
