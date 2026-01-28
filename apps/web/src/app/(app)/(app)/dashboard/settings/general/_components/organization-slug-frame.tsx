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
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
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
			toast.error("Slug cannot be empty");
			return;
		}

		const slugRegex = /^[a-z0-9-]+$/;
		if (!slugRegex.test(pendingSlug)) {
			toast.error(
				"Slug must contain only lowercase letters, numbers, and hyphens",
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
				toast.error(error.message || "Failed to update organization slug");
				return;
			}

			setSlug(pendingSlug.trim());
			setEditDialogOpen(false);
			setConfirmDialogOpen(false);
			router.refresh();
		} catch (error) {
			if (error instanceof APIError) {
				toast.error(error.message);
			} else {
				toast.error("Something went wrong");
			}
			console.error(error);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<>
			<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Organization Slug
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Your default member area URL
					</p>

					<Field>
						<FieldLabel>Member Area URL</FieldLabel>
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
									window.open(`https://${slug}.domain.com`, "_blank");
								}}
								title="Open in new tab"
							>
								<ExternalLink className="size-4" />
							</Button>
						</div>
					</Field>
				</FramePanel>
				<FrameFooter className="flex-row justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleOpenEditDialog}
					>
						Change Slug
					</Button>
				</FrameFooter>
			</Frame>

			{/* Edit Slug Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Change Organization Slug</DialogTitle>
					</DialogHeader>
					<form className="contents" onSubmit={handleEditSubmit}>
						<DialogPanel>
							<Field>
								<FieldLabel>Organization Slug</FieldLabel>
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
							<AlertDialogTitle>Change Organization Slug?</AlertDialogTitle>
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
									"Change Slug"
								)}
							</Button>
						</AlertDialogFooter>
					</AlertDialogPopup>
				</AlertDialog>
			</Dialog>
		</>
	);
}
