import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetPopup,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetPanel,
	SheetFooter,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, Users, ArrowRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { toast } from "sonner";
import { useState } from "react";

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
				toast.error(error.message || "Failed to leave organization");
				return;
			}

			toast.success(`Left ${organization.name}`);
			onOpenChange(false);
			onLeave?.();
		} catch (error) {
			toast.error("Failed to leave organization");
			console.error(error);
		} finally {
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
							<div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
								<Building2 className="size-6 text-primary" />
							</div>
						)}
						<div className="flex-1 min-w-0">
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
							<h3 className="font-semibold text-sm mb-3">Your Membership</h3>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Role</span>
									<Badge variant="secondary" className="capitalize">
										{userRole}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Member since</span>
									<span className="text-sm">
										{formatDate(organization.createdAt)}
									</span>
								</div>
							</div>
						</div>

						<Separator />

						{/* Organization Overview */}
						<div>
							<h3 className="font-semibold text-sm mb-3">Organization Overview</h3>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Users className="size-4" />
										<span>Total Members</span>
									</div>
									<span className="text-sm font-medium">
										{organization.members?.length || 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Calendar className="size-4" />
										<span>Created</span>
									</div>
									<span className="text-sm font-medium">
										{formatDate(organization.createdAt)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Building2 className="size-4" />
										<span>Organization ID</span>
									</div>
									<span className="text-sm font-mono text-muted-foreground truncate max-w-[200px]">
										{organization.id.substring(0, 12)}...
									</span>
								</div>
							</div>
						</div>

						<Separator />

						{/* Quick Actions */}
						<div>
							<h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
							<div className="space-y-2">
								<Button
									variant="outline"
									className="w-full justify-between"
									onClick={handleManageOrganization}
								>
									<span>Manage Organization Settings</span>
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
										<span>Invite Members</span>
										<ArrowRight className="size-4" />
									</Button>
								)}
							</div>
						</div>

						<Separator />

						{/* Danger Zone */}
						<div>
							<h3 className="font-semibold text-sm mb-3 text-destructive">Gefahrenbereich</h3>
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="outline"
											className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
											disabled={false} // Temporarily disabled owner check for testing
										>
											<LogOut className="mr-2 size-4" />
											Leave Organization
										</Button>
									}
								/>
								<AlertDialogPopup>
									<AlertDialogHeader>
										<AlertDialogTitle>Leave Organization</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to leave <strong>{organization.name}</strong>? You will lose access to all resources and will need to be re-invited to rejoin.
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
											{isLeaving ? "Leaving..." : "Leave Organization"}
										</AlertDialogClose>
									</AlertDialogFooter>
								</AlertDialogPopup>
							</AlertDialog>
							{/* Temporarily hidden for testing */}
							{false && userRole === "owner" && (
								<p className="text-xs text-muted-foreground mt-2">
									Owners cannot leave the organization. Transfer ownership first or delete the organization.
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
