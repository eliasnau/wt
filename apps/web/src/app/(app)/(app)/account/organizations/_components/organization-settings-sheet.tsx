import { authClient } from "@repo/auth/client";
import { ArrowRight, Building2, Calendar, LogOut, Users } from "lucide-react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
} from "@/components/ui/sheet";

interface OrganizationSettingsSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organization: {
		id: string;
		name: string;
		slug: string;
		logo?: string | null;
		createdAt: Date | string;
		members?: any[];
	} | null;
	userRole?: string;
	onLeave?: () => void;
}

export function OrganizationSettingsSheet({
	open,
	onOpenChange,
	organization,
	userRole = "member",
	onLeave,
}: OrganizationSettingsSheetProps) {
	const router = useRouter();
	const [isLeaving, setIsLeaving] = useState(false);

	if (!organization) return null;

	const handleManageOrganization = () => {
		// TODO: Navigate to full organization management page
		router.push(`/dashboard/organizations/${organization.id}`);
		onOpenChange(false);
	};

	const handleLeaveOrganization = async () => {
		setIsLeaving(true);
		try {
			const { error } = await authClient.organization.leave({
				organizationId: organization.id,
			});

			if (error) {
				let errorMessage = "Organisation konnte nicht verlassen werden";
				if (error.message) {
					errorMessage = error.message;
				}
				toast.error(errorMessage);
				setIsLeaving(false);
				return;
			}

			toast.success(`Left ${organization.name}`);
			onOpenChange(false);
			if (onLeave) {
				onLeave();
			}
			setIsLeaving(false);
		} catch (error) {
			toast.error("Organisation konnte nicht verlassen werden");
			console.error(error);
			setIsLeaving(false);
		}
	};

	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetPopup inset>
				<SheetHeader>
					<div className="flex items-center gap-3">
						{organization.logo ? (
							<img
								src={organization.logo}
								alt={organization.name}
								className="size-12 rounded-lg object-cover"
							/>
						) : (
							<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
								<Building2 className="size-6 text-primary" />
							</div>
						)}
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate">{organization.name}</SheetTitle>
							<SheetDescription className="truncate">
								{organization.slug}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-6">
						{/* Your Membership Section */}
						<div>
							<h3 className="mb-3 font-semibold text-sm">
								Deine Mitgliedschaft
							</h3>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">Rolle</span>
									<Badge variant="secondary" className="capitalize">
										{userRole}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">
										Mitglied seit
									</span>
									<span className="text-sm">
										{formatDate(organization.createdAt)}
									</span>
								</div>
							</div>
						</div>

						<Separator />

						{/* Organization Overview */}
						<div>
							<h3 className="mb-3 font-semibold text-sm">
								Organisationsübersicht
							</h3>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<Users className="size-4" />
										<span>Mitglieder gesamt</span>
									</div>
									<span className="font-medium text-sm">
										{organization.members?.length || 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<Calendar className="size-4" />
										<span>Erstellt</span>
									</div>
									<span className="font-medium text-sm">
										{formatDate(organization.createdAt)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<Building2 className="size-4" />
										<span>Organisations-ID</span>
									</div>
									<span className="max-w-[200px] truncate font-mono text-muted-foreground text-sm">
										{organization.id.substring(0, 12)}...
									</span>
								</div>
							</div>
						</div>

						<Separator />

						{/* Quick Actions */}
						<div>
							<h3 className="mb-3 font-semibold text-sm">Schnellaktionen</h3>
							<div className="space-y-2">
								<Button
									variant="outline"
									className="w-full justify-between"
									onClick={handleManageOrganization}
								>
									<span>Organisationseinstellungen verwalten</span>
									<ArrowRight className="size-4" />
								</Button>
								{/* Temporarily show for all roles - testing */}
								{true && (
									<Button
										variant="outline"
										className="w-full justify-between"
										onClick={() => {
											// TODO: Add invite member functionality
											onOpenChange(false);
										}}
									>
										<span>Mitglieder einladen</span>
										<ArrowRight className="size-4" />
									</Button>
								)}
							</div>
						</div>

						<Separator />

						{/* Danger Zone */}
						<div>
							<h3 className="mb-3 font-semibold text-destructive text-sm">
								Gefahrenbereich
							</h3>
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="outline"
											className="w-full justify-start border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
											disabled={false} // Temporarily disabled owner check for testing
										>
											<LogOut className="mr-2 size-4" />
											Leave Organization
										</Button>
									}
								/>
								<AlertDialogPopup>
									<AlertDialogHeader>
										<AlertDialogTitle>Organisation verlassen</AlertDialogTitle>
										<AlertDialogDescription>
											Möchtest du <strong>{organization.name}</strong> wirklich
											verlassen? Du verlierst den Zugriff auf alle Ressourcen
											und musst erneut eingeladen werden, um wieder beizutreten.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogClose render={<Button variant="ghost" />}>
											Cancel
										</AlertDialogClose>
										<AlertDialogClose
											render={<Button variant="destructive" />}
											onClick={handleLeaveOrganization}
											disabled={isLeaving}
										>
											{isLeaving ? "Leaving..." : "Organisation verlassen"}
										</AlertDialogClose>
									</AlertDialogFooter>
								</AlertDialogPopup>
							</AlertDialog>
							{/* Temporarily hidden for testing */}
							{false && userRole === "owner" && (
								<p className="mt-2 text-muted-foreground text-xs">
									Owners cannot leave the organization. Transfer ownership first
									or delete the organization.
								</p>
							)}
						</div>
					</div>
				</SheetPanel>
				<SheetFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</SheetFooter>
			</SheetPopup>
		</Sheet>
	);
}
