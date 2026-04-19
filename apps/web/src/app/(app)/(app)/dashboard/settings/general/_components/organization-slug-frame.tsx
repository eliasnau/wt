"use client";

import { APIError, authClient } from "@repo/auth/client";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
	Card,
	CardFrame,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";

interface OrganizationSlugFrameProps {
	organizationId: string;
	initialSlug: string;
}

export function OrganizationSlugFrame({
	organizationId,
	initialSlug,
}: OrganizationSlugFrameProps) {
	const [slug, setSlug] = useState(initialSlug);
	const [isUpdating, setIsUpdating] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [pendingSlug, setPendingSlug] = useState("");
	const router = useRouter();

	const handleOpenEditDialog = () => {
		setPendingSlug(slug);
		setEditDialogOpen(true);
	};

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!pendingSlug.trim()) {
			toast.error("Slug darf nicht leer sein");
			return;
		}

		const slugRegex = /^[a-z0-9-]+$/;
		if (!slugRegex.test(pendingSlug)) {
			toast.error(
				"Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten",
			);
			return;
		}

		if (pendingSlug.trim() === slug) {
			return;
		}

		// Show confirmation dialog
		setConfirmDialogOpen(true);
	};

	const handleConfirmUpdate = async () => {
		setIsUpdating(true);

		try {
			const { error } = await authClient.organization.update({
				data: {
					slug: pendingSlug.trim(),
				},
				organizationId,
			});

			if (error) {
				let errorMessage =
					"Organisations-Slug konnte nicht aktualisiert werden";
				if (error.message) {
					errorMessage = error.message;
				}
				toast.error(errorMessage);
				setIsUpdating(false);
				return;
			}

			setSlug(pendingSlug.trim());
			setEditDialogOpen(false);
			setConfirmDialogOpen(false);
			router.refresh();
			setIsUpdating(false);
		} catch (error) {
			if (error instanceof APIError) {
				toast.error(error.message);
			} else {
				toast.error("Etwas ist schiefgelaufen");
			}
			console.error(error);
			setIsUpdating(false);
		}
	};

	return (
		<>
			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Organization Slug</CardFrameTitle>
					<CardFrameDescription>
						Your default member area URL
					</CardFrameDescription>
				</CardFrameHeader>
				<Card>
					<CardPanel>
						<Field>
							<FieldLabel>Mitgliederbereich-URL</FieldLabel>
							<div className="flex items-center gap-2">
								<InputGroup>
									<InputGroupInput value={slug} readOnly />
									<InputGroupAddon align="inline-end">
										.domain.com
									</InputGroupAddon>
								</InputGroup>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => {
										window.open(
											`https://${slug}.domain.com`,
											"_blank",
											"noopener,noreferrer",
										);
									}}
									title="Open in new tab"
								>
									<ExternalLink className="size-4" />
								</Button>
							</div>
						</Field>
						<div className="mt-4 flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleOpenEditDialog}
							>
								Change Slug
							</Button>
						</div>
					</CardPanel>
				</Card>
			</CardFrame>

			{/* Edit Slug Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Organisations-Slug ändern</DialogTitle>
					</DialogHeader>
					<form className="contents" onSubmit={handleEditSubmit}>
						<DialogPanel>
							<Field>
								<FieldLabel>Organisations-Slug</FieldLabel>
								<InputGroup>
									<InputGroupInput
										value={pendingSlug}
										onChange={(e) =>
											setPendingSlug(e.target.value.toLowerCase())
										}
										placeholder="my-organization"
										autoFocus
										disabled={isUpdating}
									/>
									<InputGroupAddon align="inline-end">
										.domain.com
									</InputGroupAddon>
								</InputGroup>
								<p className="mt-2 text-muted-foreground text-xs">
									Only lowercase letters, numbers, and hyphens are allowed
								</p>
							</Field>
						</DialogPanel>
						<DialogFooter>
							<DialogClose
								render={<Button variant="ghost" />}
								disabled={isUpdating}
							>
								Cancel
							</DialogClose>
							<Button
								type="submit"
								disabled={isUpdating || pendingSlug.trim() === slug}
							>
								Continue
							</Button>
						</DialogFooter>
					</form>
				</DialogPopup>

				{/* Confirmation Dialog (nested) */}
				<AlertDialog
					open={confirmDialogOpen}
					onOpenChange={setConfirmDialogOpen}
				>
					<AlertDialogPopup>
						<AlertDialogHeader>
							<AlertDialogTitle>Organisations-Slug ändern?</AlertDialogTitle>
							<AlertDialogDescription className="space-y-3">
								<p>
									Changing your organization slug will update your member area
									URL:
								</p>
								<div className="flex items-center justify-center gap-2 font-mono text-sm">
									<code className="rounded-md bg-muted px-3 py-2">
										{slug}.domain.com
									</code>
									<ArrowRight className="size-4 text-muted-foreground" />
									<code className="rounded-md bg-muted px-3 py-2">
										{pendingSlug}.domain.com
									</code>
								</div>
								<p className="font-medium text-destructive">
									Warning: The old URL will no longer work and could be claimed
									by another organization.
								</p>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogClose
								render={<Button variant="ghost" />}
								disabled={isUpdating}
							>
								Go Back
							</AlertDialogClose>
							<Button onClick={handleConfirmUpdate} disabled={isUpdating}>
								{isUpdating ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Saving...
									</>
								) : (
									"Slug ändern"
								)}
							</Button>
						</AlertDialogFooter>
					</AlertDialogPopup>
				</AlertDialog>
			</Dialog>
		</>
	);
}
