"use client";

import { useState } from "react";
import { authClient } from "@repo/auth/client";
import { Button } from "@/components/ui/button";
import {
	Frame,
	FramePanel,
	FrameFooter,
} from "@/components/ui/frame";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function DeleteAccountFrame() {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteAccount = async () => {
		setIsDeleting(true);

		try {
			await authClient.deleteUser();
			toast.success("Account deleted successfully");

			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						window.location.href = "/";
					},
				},
			});
		} catch (error) {
			toast.error("Failed to delete account");
			console.error(error);
			setIsDeleting(false);
		}
	};

	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72 border-destructive/50">
			<FramePanel>
				<h2 className="font-heading text-xl text-destructive mb-2">Gefahrenbereich</h2>
				<p className="text-sm text-muted-foreground">
					Permanently delete your account and all associated data. This action
					cannot be undone and you will lose access to all your data.
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
								Deleting account...
							</>
						) : (
							"Delete My Account"
						)}
					</AlertDialogTrigger>
					<AlertDialogPopup>
						<AlertDialogHeader>
							<AlertDialogTitle>Bist du dir absolut sicher?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete your
								account and remove all of your data from our servers including:
								<ul className="list-disc list-inside mt-2 space-y-1">
									<li>Your profile and personal information</li>
									<li>All organizations you own</li>
									<li>All projects and associated data</li>
									<li>Your access to shared resources</li>
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
								Yes, Delete My Account
							</AlertDialogClose>
						</AlertDialogFooter>
					</AlertDialogPopup>
				</AlertDialog>
			</FrameFooter>
		</Frame>
	);
}
