"use client";

import { authClient } from "@repo/auth/client";
import { Loader2, Plus, Building2, Settings, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
} from "@/components/ui/empty";
import { useAuth } from "@/hooks/use-auth";
import type { Route } from "next";
import { ORPCError } from "@orpc/client";

export default function OrganizationsPage() {
	const {
		data: organizations,
		isPending,
		refetch,
	} = authClient.useListOrganizations();
	const { session, switchOrganization } = useAuth();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [isSwitching, setIsSwitching] = useState(false);
	const [orgName, setOrgName] = useState("");
	const [orgSlug, setOrgSlug] = useState("");
	const router = useRouter();
	const [redirectUrl] = useQueryState("redirect");

	const handleCreateOrganization = async () => {
		if (!orgName.trim() || !orgSlug.trim()) {
			toast.error("Bitte fülle alle Felder aus");
			return;
		}

		// Validate slug format (lowercase, alphanumeric, hyphens)
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
				toast.error(error.message || "Organisation konnte nicht erstellt werden");
				return;
			}

			toast.success("Organisation erfolgreich erstellt");
			setIsCreateDialogOpen(false);
			setOrgName("");
			setOrgSlug("");
			refetch();
		} catch (error) {
			toast.error("Organisation konnte nicht erstellt werden");
			console.error(error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleSetActiveOrg = async (organizationId: string) => {
		setIsSwitching(true);
		try {
			await switchOrganization(organizationId, "organizations_page");
			router.push((redirectUrl || "/dashboard") as Route);
		} catch (error) {
			toast.error(
				error instanceof ORPCError
					? error.message
					: "Aktive Organisation konnte nicht gesetzt werden",
			);
		} finally {
			setIsSwitching(false);
		}
	};

	// Auto-generate slug from name
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

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4 bg-sidebar">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-sidebar">
			<div className="w-full max-w-2xl">
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<div className="mb-6">
							<h1 className="font-heading text-2xl">Organisation auswählen</h1>
							<p className="text-sm text-muted-foreground">
								Wähle eine Organisation, um fortzufahren
							</p>
						</div>

						{organizations && organizations.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<Building2 />
									</EmptyMedia>
									<EmptyTitle>Noch keine Organisationen</EmptyTitle>
									<EmptyDescription>
										Lege los, indem du deine erste Organisation erstellst
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button onClick={() => setIsCreateDialogOpen(true)}>
										<Plus className="size-4" />
										<span className="ml-2">Organisation erstellen</span>
									</Button>
								</EmptyContent>
							</Empty>
						) : (
							<div className="space-y-2">
								{organizations?.map((org) => {
									const isActive =
										session?.session?.activeOrganizationId === org.id;

									return (
										<button
											key={org.id}
											type="button"
											onClick={() => handleSetActiveOrg(org.id)}
											disabled={isSwitching}
											className="w-full flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
										>
											{org.logo ? (
												<img
													src={org.logo}
													alt={org.name}
													className="size-10 rounded-md object-cover flex-shrink-0"
												/>
											) : (
												<div className="size-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
													<Building2 className="size-5 text-primary" />
												</div>
											)}
											<div className="flex-1 text-left min-w-0">
												<p className="font-medium truncate">{org.name}</p>
												<p className="text-sm text-muted-foreground truncate">
													{org.slug}
												</p>
											</div>
											{isActive && (
												<Badge
													variant="secondary"
													className="text-xs flex-shrink-0"
												>
													Active
												</Badge>
											)}
											<ChevronRight className="size-5 text-muted-foreground flex-shrink-0" />
										</button>
									);
								})}
							</div>
						)}
					</FramePanel>

					{organizations && organizations.length > 0 && (
						<FrameFooter className="flex-row justify-between">
							<Button variant="ghost" onClick={() => router.push("/account")}>
								<Settings className="size-4" />
								<span className="ml-2">Konto verwalten</span>
							</Button>
							<Button onClick={() => setIsCreateDialogOpen(true)}>
								<Plus className="size-4" />
								<span className="ml-2">Organisation erstellen</span>
							</Button>
						</FrameFooter>
					)}
				</Frame>
			</div>
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
							<p className="text-xs text-muted-foreground mt-2">
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
		</div>
	);
}
