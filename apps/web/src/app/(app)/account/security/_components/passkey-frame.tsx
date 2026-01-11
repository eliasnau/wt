"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { authClient } from "@repo/auth/client";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
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
import {
	Dialog,
	DialogClose,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "sonner";
import {
	Edit,
	Fingerprint,
	Info,
	Loader2,
	Plus,
	AlertCircle,
} from "lucide-react";
import { getAAGUIDInfo } from "@/lib/aaguid-data";
import { useQuery } from "@tanstack/react-query";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { FingerprintIcon } from "@/components/animate-ui/icons/fingerprint";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import type { Passkey } from "@repo/auth";
import { formatDistanceToNow } from "date-fns";

export function PasskeyFrame({
	currentSessionId,
	initalPasskeys,
}: {
	currentSessionId: string;
	initalPasskeys: Passkey[];
}) {
	const [isAddingPasskey, setIsAddingPasskey] = useState(false);
	const [editingPasskey, setEditingPasskey] = useState<Passkey | null>(null);
	const [newPasskeyName, setNewPasskeyName] = useState("");
	const [isUpdatingName, setIsUpdatingName] = useState(false);

	const {
		data: passkeys,
		refetch,
		isPending,
		error,
	} = useQuery({
		queryKey: ["passkeys", currentSessionId],
		retry: 1,
		queryFn: async () => {
			const { data, error } = await authClient.passkey.listUserPasskeys();
			if (error) {
				throw new Error(error.message || "Failed to load passkeys");
			}
			return data;
		},
		initialData: initalPasskeys,
	});

	const handleAddPasskey = useCallback(async () => {
		setIsAddingPasskey(true);
		try {
			const { error } = await authClient.passkey.addPasskey();
			if (error) {
				toast.error("Failed to add passkey");
			} else {
				toast.success("Passkey added successfully");
				await refetch();
			}
		} catch {
			toast.error("Failed to add passkey");
		} finally {
			setIsAddingPasskey(false);
		}
	}, [refetch]);

	const handleDeletePasskey = useCallback(
		async (passkeyId: string) => {
			try {
				const { error } = await authClient.passkey.deletePasskey({
					id: passkeyId,
				});
				if (error) {
					toast.error("Failed to delete passkey");
				} else {
					toast.success("Passkey deleted successfully");
					refetch();
				}
			} catch {
				toast.error("Failed to delete passkey");
			}
		},
		[refetch],
	);

	const handleUpdatePasskeyName = useCallback(async () => {
		if (!editingPasskey || !newPasskeyName.trim()) {
			toast.error("Please enter a passkey name");
			return;
		}
		setIsUpdatingName(true);
		try {
			const { error } = await authClient.passkey.updatePasskey({
				id: editingPasskey.id,
				name: newPasskeyName.trim(),
			});
			if (error) {
				toast.error("Failed to update passkey name");
			} else {
				toast.success("Passkey name updated successfully");
				await refetch();
				setEditingPasskey(null);
				setNewPasskeyName("");
			}
		} catch {
			toast.error("Failed to update passkey name");
		} finally {
			setIsUpdatingName(false);
		}
	}, [editingPasskey, newPasskeyName, refetch]);

	const openEditDialog = useCallback((passkey: Passkey) => {
		setEditingPasskey(passkey);
		setNewPasskeyName(passkey.name || "");
	}, []);

	if (isPending) {
		return (
			<Frame
				data-passkey-frame
				className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
			>
				<FramePanel>
					<h2 className="font-heading text-xl mb-2 text-foreground">
						Passkeys
					</h2>
					<p className="text-sm text-muted-foreground mb-6">
						Use your fingerprint, face, or device PIN for secure passwordless
						authentication.
					</p>
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				</FramePanel>
			</Frame>
		);
	}

	if (error) {
		return (
			<Frame
				data-passkey-frame
				className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
			>
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Fingerprint />
							</EmptyMedia>
							<EmptyTitle>Failed to load passkeys</EmptyTitle>
							<EmptyDescription>
								{error instanceof Error
									? error.message
									: "Something went wrong. Please try again."}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={() => refetch()}>Try Again</Button>
						</EmptyContent>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	if (!passkeys || passkeys.length === 0) {
		return (
			<>
				<Frame
					data-passkey-frame
					className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
				>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Fingerprint />
								</EmptyMedia>
								<EmptyTitle>Passkeys</EmptyTitle>
								<EmptyDescription>
									Add a passkey for faster and more secure sign in
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</FramePanel>

					<FrameFooter className="flex-row justify-between items-center">
						<Tooltip>
							<TooltipTrigger
								render={
									<button
										type="button"
										className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
									/>
								}
							>
								<Info className="size-3.5" />
								<span>What are passkeys?</span>
							</TooltipTrigger>
							<TooltipContent>
								<p className="text-xs max-w-xs">
									Passkeys use your device's biometric authentication
									(fingerprint, face ID) for secure, passwordless sign-in
								</p>
							</TooltipContent>
						</Tooltip>

						<Button
							onClick={handleAddPasskey}
							disabled={isAddingPasskey}
							variant="outline"
							size="sm"
						>
							{isAddingPasskey ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Adding...
								</>
							) : (
								<>
									<Plus className="mr-2 size-4" />
									Add Passkey
								</>
							)}
						</Button>
					</FrameFooter>
				</Frame>
			</>
		);
	}

	return (
		<>
			<Frame
				data-passkey-frame
				className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
			>
				<FramePanel>
					<h2 className="font-heading text-xl mb-2 text-foreground">
						Passkeys
					</h2>
					<p className="text-sm text-muted-foreground mb-6">
						Use your fingerprint, face, or device PIN for secure passwordless
						authentication.
					</p>

					<div className="space-y-2">
						{passkeys.map((passkey) => (
							<div
								key={passkey.id}
								className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
							>
								<div className="flex items-center gap-4">
									<PasskeyIcon aaguid={passkey.aaguid} />
									<div>
										<p className="text-sm font-medium">
											{passkey.name || "Unnamed Passkey"}
										</p>
										<p className="text-xs text-muted-foreground">
											Added{" "}
											{passkey.createdAt
												? formatDistanceToNow(new Date(passkey.createdAt), {
														addSuffix: true,
														locale: undefined
													})
												: "recently"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() =>
											openEditDialog({
												...passkey,
												name: passkey.name ?? null,
											})
										}
										className="hover:bg-accent"
									>
										<Edit className="size-4" />
									</Button>
									<AlertDialog>
										<AnimateIcon animateOnHover>
											<AlertDialogTrigger
												render={
													<Button
														variant="ghost"
														size="icon"
														className="hover:bg-destructive/10"
													/>
												}
											>
												<Trash2 className="size-4 text-destructive" />
											</AlertDialogTrigger>
										</AnimateIcon>
										<AlertDialogPopup>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete Passkey</AlertDialogTitle>
												<AlertDialogDescription>
													Are you sure you want to delete this passkey? You
													won't be able to use it to sign in anymore.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogClose render={<Button variant="ghost" />}>
													Cancel
												</AlertDialogClose>
												<AlertDialogClose
													render={<Button variant="destructive" />}
													onClick={() => handleDeletePasskey(passkey.id)}
												>
													Delete Passkey
												</AlertDialogClose>
											</AlertDialogFooter>
										</AlertDialogPopup>
									</AlertDialog>
								</div>
							</div>
						))}
					</div>
				</FramePanel>

				<FrameFooter className="flex-row justify-between items-center">
					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
								/>
							}
						>
							<Info className="size-3.5" />
							<span>What are passkeys?</span>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs max-w-xs">
								Passkeys use your device's biometric authentication
								(fingerprint, face ID) for secure, passwordless sign-in
							</p>
						</TooltipContent>
					</Tooltip>
					<AnimateIcon animateOnHover>
						<Button
							onClick={handleAddPasskey}
							disabled={isAddingPasskey}
							variant="outline"
							size="sm"
						>
							{isAddingPasskey ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Adding...
								</>
							) : (
								<>
									<FingerprintIcon className="mr-2 size-4" />
									Add Passkey
								</>
							)}
						</Button>
					</AnimateIcon>
				</FrameFooter>
			</Frame>

			<Dialog
				open={!!editingPasskey}
				onOpenChange={(open) => !open && setEditingPasskey(null)}
			>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Edit Passkey Name</DialogTitle>
					</DialogHeader>
					<DialogPanel>
						<Field>
							<FieldLabel>Passkey Name</FieldLabel>
							<Input
								value={newPasskeyName}
								onChange={(e) => setNewPasskeyName(e.target.value)}
								placeholder="e.g., My iPhone, Work Laptop"
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
							onClick={handleUpdatePasskeyName}
							disabled={isUpdatingName || !newPasskeyName.trim()}
						>
							{isUpdatingName ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
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

function PasskeyIcon({ aaguid }: { aaguid?: string | null }) {
	const { resolvedTheme } = useTheme();
	const { iconComponent: IconComponent, name } = getAAGUIDInfo(aaguid);

	return (
		<Tooltip>
			<TooltipTrigger>
				<div className="p-3 rounded-lg bg-primary/10 cursor-help">
					{IconComponent ? (
						<IconComponent
							className="size-8"
							theme={resolvedTheme === "dark" ? "dark" : "light"}
						/>
					) : (
						<Fingerprint className="size-8 text-primary" />
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<p className="text-xs">{name}</p>
			</TooltipContent>
		</Tooltip>
	);
}
