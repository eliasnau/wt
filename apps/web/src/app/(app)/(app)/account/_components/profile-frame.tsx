	"use client";

	import { useState } from "react";
	import { authClient } from "@repo/auth/client";
	import { Button } from "@/components/ui/button";
	import {
		Frame,
		FramePanel,
	} from "@/components/ui/frame";
	import {
		Dialog,
		DialogClose,
		DialogFooter,
		DialogHeader,
		DialogPanel,
		DialogPopup,
		DialogTitle,
		DialogTrigger,
	} from "@/components/ui/dialog";
	import { Field, FieldLabel } from "@/components/ui/field";
	import { Input } from "@/components/ui/input";
	import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

	interface ProfileFrameProps {
		initialName: string;
		initialEmail: string;
	}

	export function ProfileFrame({ initialName, initialEmail }: ProfileFrameProps) {
		const [currentName, setCurrentName] = useState(initialName);
		const [currentEmail, setCurrentEmail] = useState(initialEmail);
		const [nameDialogOpen, setNameDialogOpen] = useState(false);
		const [emailDialogOpen, setEmailDialogOpen] = useState(false);
		const [newName, setNewName] = useState("");
		const [newEmail, setNewEmail] = useState("");
		const [isUpdatingName, setIsUpdatingName] = useState(false);
		const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

		const handleUpdateName = async () => {
			if (!newName.trim()) {
				toast.error("Name cannot be empty");
				return;
			}

			setIsUpdatingName(true);

			try {
				await authClient.updateUser(
					{ name: newName.trim() },
					{
						onSuccess: () => {
							toast.success("Name updated successfully");
							setCurrentName(newName.trim());
							setNameDialogOpen(false);
							setNewName("");
						},
						onError: (context) => {
							toast.error(context.error.message || "Failed to update name");
						},
					}
				);

			} catch (error) {
				toast.error("Failed to update name");
				console.error(error);
			} finally {
				setIsUpdatingName(false);
			}
		};

		const handleUpdateEmail = async () => {
			if (!newEmail.trim()) {
				toast.error("Email cannot be empty");
				return;
			}

			setIsUpdatingEmail(true);
			try {
				await authClient.changeEmail(
					{ newEmail: newEmail.trim() },
					{
						onSuccess: () => {
							toast.success("Verification email sent", {
								description:
									"Check your inbox to confirm the new email address.",
							});
              
							setEmailDialogOpen(false);
							setNewEmail("");
						},
						onError: (context) => {
							toast.error(context.error.message || "Failed to change email");
						},
					}
				);
			} catch (error) {
				toast.error("Failed to change email");
				console.error(error);
			} finally {
				setIsUpdatingEmail(false);
			}
		};

		return (
			<>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h2 className="font-heading text-xl mb-2 text-foreground">Profile Information</h2>
						<p className="text-sm text-muted-foreground mb-6">
							Update your personal information and email address.
						</p>
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground mb-1">Display Name</p>
									<p className="text-base text-foreground">{currentName}</p>
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
									<p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
									<p className="text-base text-foreground">{currentEmail}</p>
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
							<DialogTitle>Change Display Name</DialogTitle>
						</DialogHeader>
						<DialogPanel>
							<Field>
								<FieldLabel>Display Name</FieldLabel>
								<Input
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="Enter your name"
									autoFocus
								/>
							</Field>
						</DialogPanel>
						<DialogFooter>
							<DialogClose render={<Button variant="ghost" />} disabled={isUpdatingName}>
								Cancel
							</DialogClose>
							<Button 
								onClick={handleUpdateName}
								disabled={isUpdatingName || !newName.trim() || newName.trim() === currentName}
							>
								{isUpdatingName ? (
									<>
										<Spinner />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</Button>
						</DialogFooter>
					</DialogPopup>
				</Dialog>

				<Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
					<DialogPopup>
						<DialogHeader>
							<DialogTitle>Change Email Address</DialogTitle>
						</DialogHeader>
						<DialogPanel>
							<Field>
								<FieldLabel>Email Address</FieldLabel>
								<Input
									type="email"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									placeholder="Enter your email"
									autoFocus
								/>
								<p className="text-xs text-muted-foreground mt-2">
									A verification email will be sent to the new address
								</p>
							</Field>
						</DialogPanel>
						<DialogFooter>
							<DialogClose render={<Button variant="ghost" />} disabled={isUpdatingEmail}>
								Cancel
							</DialogClose>
							<Button 
								onClick={handleUpdateEmail}
								disabled={isUpdatingEmail || !newEmail.trim() || newEmail.trim() === currentEmail}
							>
								{isUpdatingEmail ? (
									<>
										<Spinner />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</Button>
						</DialogFooter>
					</DialogPopup>
				</Dialog>
			</>
		);
	}
