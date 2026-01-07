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
	Dialog,
	DialogClose,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Key } from "@/components/animate-ui/icons/key";

export function ChangePasswordFrame() {
	const [open, setOpen] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);

	const resetForm = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setRevokeOtherSessions(false);
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			resetForm();
		}
	};

	const handleChangePassword = async () => {
		if (!currentPassword.trim()) {
			toast.error("Current password is required");
			return;
		}

		if (!newPassword.trim()) {
			toast.error("New password is required");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		setIsChangingPassword(true);

		try {
			const { data, error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions,
			});

			if (error) {
				toast.error(error.message || "Failed to change password");
				console.error(error);
			} else {
				toast.success(
					revokeOtherSessions
						? "Password changed and other sessions revoked"
						: "Password changed successfully"
				);
				resetForm();
				setOpen(false);
			}
		} catch (error) {
			toast.error("Failed to change password");
			console.error(error);
		} finally {
			setIsChangingPassword(false);
		}
	};

	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				<h2 className="font-heading text-xl mb-2 text-foreground">Password</h2>
				<p className="text-sm text-muted-foreground">
					Update your password regularly to keep your account secure.
				</p>
			</FramePanel>
			<FrameFooter className="flex-row justify-between items-center">
				<Tooltip>
					<TooltipTrigger render={<button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" />}>
						<Info className="size-3.5" />
						<span>Password requirements</span>
					</TooltipTrigger>
					<TooltipContent>
						<p className="text-xs">Password must be at least 8 characters long</p>
					</TooltipContent>
				</Tooltip>

				<Dialog open={open} onOpenChange={handleOpenChange}>
					<AnimateIcon animateOnHover>
						<DialogTrigger render={<Button variant="outline" />}>
							<Key className="mr-2 size-4" />
							Change Password
						</DialogTrigger>
					</AnimateIcon>
					<DialogPopup>
						<DialogHeader>
							<DialogTitle>Change Password</DialogTitle>
						</DialogHeader>
						<DialogPanel className="space-y-4">
							<Field>
								<FieldLabel>Current Password</FieldLabel>
								<Input
									type="password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									placeholder="Enter your current password"
								/>
							</Field>

							<Field>
								<FieldLabel>New Password</FieldLabel>
								<Input
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Enter your new password"
								/>
							</Field>

							<Field>
								<FieldLabel>Confirm New Password</FieldLabel>
								<Input
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Confirm your new password"
								/>
							</Field>

							<div className="flex items-start space-x-3 rounded-lg border p-4">
								<Checkbox
									id="revoke-sessions"
									checked={revokeOtherSessions}
									onCheckedChange={(checked) =>
										setRevokeOtherSessions(checked as boolean)
									}
									className="mt-0.5"
								/>
								<label
									htmlFor="revoke-sessions"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
								>
									Sign out from all other devices
								</label>
							</div>
						</DialogPanel>
						<DialogFooter>
							<DialogClose render={<Button variant="ghost" />} disabled={isChangingPassword}>
								Cancel
							</DialogClose>
							<Button
								onClick={handleChangePassword}
								disabled={isChangingPassword}
							>
								{isChangingPassword ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Updating...
									</>
								) : (
									"Update Password"
								)}
							</Button>
						</DialogFooter>
					</DialogPopup>
				</Dialog>
			</FrameFooter>
		</Frame>
	);
}
