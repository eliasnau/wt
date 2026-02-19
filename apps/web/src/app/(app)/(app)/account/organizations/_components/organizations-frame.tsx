"use client";

import { ORPCError } from "@orpc/client";
import { authClient } from "@repo/auth/client";
import {
	Building2,
	Check,
	Loader2,
	Plus,
	Settings,
	Trash2,
	Users,
} from "lucide-react";
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
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { OrganizationSettingsSheet } from "./organization-settings-sheet";

type Organization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	createdAt: Date | string;
	members?: any[];
};

export function OrganizationsFrame() {
	const {
		data: organizationsData,
		isPending,
		refetch,
	} = authClient.useListOrganizations();
	const organizations = organizationsData as Organization[] | undefined;
	const { session, switchOrganization } = useAuth();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [orgName, setOrgName] = useState("");
	const [orgSlug, setOrgSlug] = useState("");
	const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
	const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);

	const handleCreateOrganization = async () => {
		if (!orgName.trim() || !orgSlug.trim()) {
			toast.error("Bitte fülle alle Felder aus");
			return;
		}

		const slugRegex = /^[a-z0-9-]+$/;
		if (!slugRegex.test(orgSlug)) {
			toast.error(
				"Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten",
			);
			return;
		}

		setIsCreating(true);

		try {
			const { data, error } = await authClient.organization.create({
				name: orgName.trim(),
				slug: orgSlug.trim(),
			});

			if (error) {
				let errorMessage = "Organisation konnte nicht erstellt werden";
				if (error.message) {
					errorMessage = error.message;
				}
				toast.error(errorMessage);
				setIsCreating(false);
				return;
			}

			toast.success("Organisation erfolgreich erstellt");
			setIsCreateDialogOpen(false);
			setOrgName("");
			setOrgSlug("");
			refetch();
			setIsCreating(false);
		} catch (error) {
			toast.error("Organisation konnte nicht erstellt werden");
			console.error(error);
			setIsCreating(false);
		}
	};

	const handleSetActiveOrg = async (organizationId: string) => {
		try {
			await switchOrganization(organizationId);
		} catch (error) {
			let errorMessage = "Aktive Organisation konnte nicht gesetzt werden";
			if (error instanceof ORPCError) {
				errorMessage = error.message;
			}
			toast.error(errorMessage);
		}
	};

	const handleDeleteOrganization = async (organizationId: string) => {
		setDeletingOrgId(organizationId);

		try {
			const { error } = await authClient.organization.delete({
				organizationId,
			});

			if (error) {
				let errorMessage = "Organisation konnte nicht gelöscht werden";
				if (error.message) {
					errorMessage = error.message;
				}
				toast.error(errorMessage);
				setDeletingOrgId(null);
				return;
			}

			toast.success("Organisation erfolgreich gelöscht");
			refetch();
			setDeletingOrgId(null);
		} catch (error) {
			toast.error("Organisation konnte nicht gelöscht werden");
			console.error(error);
			setDeletingOrgId(null);
		}
	};

	const handleNameChange = (value: string) => {
		setOrgName(value);
		if (!orgSlug || orgSlug === orgName.toLowerCase().replace(/\s+/g, "-")) {
			setOrgSlug(
				value
					.toLowerCase()
					.replace(/\s+/g, "-")
					.replace(/[^a-z0-9-]/g, ""),
			);
		}
	};

	const handleOpenSettings = (org: Organization) => {
		setSelectedOrg(org);
		setIsSettingsSheetOpen(true);
	};

	if (isPending) {
		return (
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Organizations
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Verwalte deine Organisationen und arbeite mit deinem Team zusammen
					</p>
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				</FramePanel>
			</Frame>
		);
	}

	if (organizations && organizations.length === 0) {
		return (
			<>
				<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Building2 />
								</EmptyMedia>
								<EmptyTitle>Organisationen</EmptyTitle>
								<EmptyDescription>
									Erstelle eine Organisation, um mit deinem Team
									zusammenzuarbeiten
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</FramePanel>

					<FrameFooter className="flex-row justify-end">
						<Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
							<Plus className="mr-2 size-4" />
							Organisation erstellen
						</Button>
					</FrameFooter>
				</Frame>

				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogPopup>
						<DialogHeader>
							<DialogTitle>Organisation erstellen</DialogTitle>
						</DialogHeader>
						<DialogPanel className="space-y-4">
							<Field>
								<FieldLabel>Organisationsname</FieldLabel>
								<Input
									value={orgName}
									onChange={(e) => handleNameChange(e.target.value)}
									placeholder="Acme Inc."
									autoFocus
								/>
							</Field>
							<Field>
								<FieldLabel>Organisations-Slug</FieldLabel>
								<Input
									value={orgSlug}
									onChange={(e) =>
										setOrgSlug(
											e.target.value
												.toLowerCase()
												.replace(/\s+/g, "-")
												.replace(/[^a-z0-9-]/g, ""),
										)
									}
									placeholder="acme-inc"
								/>
								<p className="mt-2 text-muted-foreground text-xs">
									Used in URLs. Only lowercase letters, numbers, and hyphens
									allowed.
								</p>
							</Field>
						</DialogPanel>
						<DialogFooter>
							<DialogClose
								render={<Button variant="ghost" />}
								disabled={isCreating}
							>
								Cancel
							</DialogClose>
							<Button
								onClick={handleCreateOrganization}
								disabled={isCreating || !orgName.trim() || !orgSlug.trim()}
							>
								{isCreating ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Creating...
									</>
								) : (
									"Organisation erstellen"
								)}
							</Button>
						</DialogFooter>
					</DialogPopup>
				</Dialog>
			</>
		);
	}

	return (
		<>
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Organizations
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Verwalte deine Organisationen und arbeite mit deinem Team zusammen
					</p>

					<div className="space-y-3">
						{organizations?.map((org) => {
							const isActive =
								session?.session?.activeOrganizationId === org.id;
							const isDeleting = deletingOrgId === org.id;

							return (
								<div
									key={org.id}
									className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
								>
									<div className="flex min-w-0 flex-1 items-center gap-3">
										{org.logo ? (
											<img
												src={org.logo}
												alt={org.name}
												className="size-10 flex-shrink-0 rounded-md object-cover"
											/>
										) : (
											<div className="flex size-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
												<Building2 className="size-5 text-primary" />
											</div>
										)}
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<p className="truncate font-medium">{org.name}</p>
												{isActive && (
													<span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
														Active
													</span>
												)}
											</div>
											<div className="flex items-center gap-4 text-muted-foreground text-sm">
												<span className="truncate">{org.slug}</span>
												<span className="flex items-center gap-1 whitespace-nowrap">
													<Users className="size-3" />
													{org.members?.length || 0}
												</span>
											</div>
										</div>
									</div>

									<div className="flex flex-shrink-0 items-center gap-2">
										{isActive ? (
											<Button variant="outline" size="sm" disabled>
												<Check className="mr-2 size-4" />
												Selected
											</Button>
										) : (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleSetActiveOrg(org.id)}
											>
												Select
											</Button>
										)}
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleOpenSettings(org)}
										>
											<Settings className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteOrganization(org.id)}
											disabled={isDeleting}
										>
											{isDeleting ? (
												<Loader2 className="size-4 animate-spin" />
											) : (
												<Trash2 className="size-4" />
											)}
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</FramePanel>

				<FrameFooter className="flex-row justify-end">
					<Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
						<Plus className="mr-2 size-4" />
						Organisation erstellen
					</Button>
				</FrameFooter>
			</Frame>

			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Organisation erstellen</DialogTitle>
					</DialogHeader>
					<DialogPanel className="space-y-4">
						<Field>
							<FieldLabel>Organisationsname</FieldLabel>
							<Input
								value={orgName}
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder="Acme Inc."
								autoFocus
							/>
						</Field>
						<Field>
							<FieldLabel>Organisations-Slug</FieldLabel>
							<Input
								value={orgSlug}
								onChange={(e) =>
									setOrgSlug(
										e.target.value
											.toLowerCase()
											.replace(/\s+/g, "-")
											.replace(/[^a-z0-9-]/g, ""),
									)
								}
								placeholder="acme-inc"
							/>
							<p className="mt-2 text-muted-foreground text-xs">
								Used in URLs. Only lowercase letters, numbers, and hyphens
								allowed.
							</p>
						</Field>
					</DialogPanel>
					<DialogFooter>
						<DialogClose
							render={<Button variant="ghost" />}
							disabled={isCreating}
						>
							Cancel
						</DialogClose>
						<Button
							onClick={handleCreateOrganization}
							disabled={isCreating || !orgName.trim() || !orgSlug.trim()}
						>
							{isCreating ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Creating...
								</>
							) : (
								"Organisation erstellen"
							)}
						</Button>
					</DialogFooter>
				</DialogPopup>
			</Dialog>

			<OrganizationSettingsSheet
				open={isSettingsSheetOpen}
				onOpenChange={setIsSettingsSheetOpen}
				organization={selectedOrg}
				userRole="owner"
				onLeave={refetch}
			/>
		</>
	);
}
