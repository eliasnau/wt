"use client";

import type { Passkey } from "@repo/auth";
import { authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	AlertCircle,
	Edit,
	Fingerprint,
	Info,
	Loader2,
	Plus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FingerprintIcon } from "@/components/animate-ui/icons/fingerprint";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
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
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAAGUIDInfo } from "@/lib/aaguid-data";

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
				throw new Error(
					error.message || "Passkeys konnten nicht geladen werden",
				);
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
				toast.error("Passkey konnte nicht hinzugefügt werden");
			} else {
				toast.success("Passkey erfolgreich hinzugefügt");
				await refetch();
			}
			setIsAddingPasskey(false);
		} catch {
			toast.error("Passkey konnte nicht hinzugefügt werden");
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
					toast.error("Passkey konnte nicht gelöscht werden");
				} else {
					toast.success("Passkey erfolgreich gelöscht");
					refetch();
				}
			} catch {
				toast.error("Passkey konnte nicht gelöscht werden");
			}
		},
		[refetch],
	);

	const handleUpdatePasskeyName = useCallback(async () => {
		if (!editingPasskey || !newPasskeyName.trim()) {
			toast.error("Bitte gib einen Passkey-Namen ein");
			return;
		}
		setIsUpdatingName(true);
		try {
			const { error } = await authClient.passkey.updatePasskey({
				id: editingPasskey.id,
				name: newPasskeyName.trim(),
			});
			if (error) {
				toast.error("Passkey-Name konnte nicht aktualisiert werden");
			} else {
				toast.success("Passkey-Name erfolgreich aktualisiert");
				await refetch();
				setEditingPasskey(null);
				setNewPasskeyName("");
			}
			setIsUpdatingName(false);
		} catch {
			toast.error("Passkey-Name konnte nicht aktualisiert werden");
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
				className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
			>
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Passkeys
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Nutze deinen Fingerabdruck, dein Gesicht oder die Geräte-PIN für
						eine sichere passwortlose authentication.
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
				className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
			>
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Fingerprint />
							</EmptyMedia>
							<EmptyTitle>Passkeys konnten nicht geladen werden</EmptyTitle>
							<EmptyDescription>
								{error instanceof Error
									? error.message
									: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={() => refetch()}>Erneut versuchen</Button>
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
					className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
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

					<FrameFooter className="flex-row items-center justify-between">
						<Tooltip>
							<TooltipTrigger
								render={
									<button
										type="button"
										className="flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
									/>
								}
							>
								<Info className="size-3.5" />
								<span>Was sind Passkeys?</span>
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-xs text-xs">
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
				className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
			>
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Passkeys
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Nutze deinen Fingerabdruck, dein Gesicht oder die Geräte-PIN für
						eine sichere passwortlose authentication.
					</p>

					<div className="space-y-2">
						{passkeys.map((passkey) => (
							<div
								key={passkey.id}
								className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
							>
								<div className="flex items-center gap-4">
									<PasskeyIcon aaguid={passkey.aaguid} />
									<div>
										<p className="font-medium text-sm">
											{passkey.name || "Unbenannter Passkey"}
										</p>
										<p className="text-muted-foreground text-xs">
											Added{" "}
											{passkey.createdAt
												? formatDistanceToNow(new Date(passkey.createdAt), {
														addSuffix: true,
														locale: undefined,
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
												name: passkey.name ?? undefined,
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
												<AlertDialogTitle>Passkey löschen</AlertDialogTitle>
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

				<FrameFooter className="flex-row items-center justify-between">
					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									className="flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
								/>
							}
						>
							<Info className="size-3.5" />
							<span>Was sind Passkeys?</span>
						</TooltipTrigger>
						<TooltipContent>
							<p className="max-w-xs text-xs">
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
						<DialogTitle>Passkey-Namen bearbeiten</DialogTitle>
					</DialogHeader>
					<DialogPanel>
						<Field>
							<FieldLabel>Passkey-Name</FieldLabel>
							<Input
								value={newPasskeyName}
								onChange={(e) => setNewPasskeyName(e.target.value)}
								placeholder="z. B. Mein iPhone, Arbeitslaptop"
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
								"Änderungen speichern"
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
				<div className="cursor-help rounded-lg bg-primary/10 p-3">
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
