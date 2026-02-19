"use client";

import { authClient } from "@repo/auth/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, Mail, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { CancelInvitationDialog } from "./confirm-dialogs";

type Invitation = {
	id: string;
	email: string;
	role: string;
	status: string;
};

export function InvitationsSection() {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const [cancelInviteOpen, setCancelInviteOpen] = useState(false);
	const [selectedInvitation, setSelectedInvitation] =
		useState<Invitation | null>(null);

	const { data: invitationsData, refetch: refetchInvitations } = useQuery({
		queryKey: ["organization-invitations", activeOrg?.id],
		retry: 1,
		queryFn: async () => {
			if (!activeOrg?.id) return null;

			const result = await authClient.organization.listInvitations({
				query: {
					organizationId: activeOrg.id,
				},
			});

			if (result.error) {
				throw new Error(
					result.error.message || "Einladungen konnten nicht geladen werden",
				);
			}

			return result.data;
		},
		enabled: !!activeOrg,
	});

	const invitations = invitationsData || [];
	const pendingInvitations = invitations.filter(
		(inv) => inv.status.toLowerCase() === "pending",
	);
	const sortedInvitations = [
		...pendingInvitations,
		...invitations.filter((inv) => inv.status.toLowerCase() !== "pending"),
	];

	const cancelInvitationMutation = useMutation({
		mutationFn: async (invitationId: string) => {
			const result = await authClient.organization.cancelInvitation({
				invitationId,
			});
			if (result.error) {
				throw new Error(
					result.error.message || "Einladung konnte nicht abgebrochen werden",
				);
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Einladung abgebrochen");
			refetchInvitations();
			setCancelInviteOpen(false);
			setSelectedInvitation(null);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "Einladung konnte nicht abgebrochen werden",
			);
			setCancelInviteOpen(false);
			setSelectedInvitation(null);
		},
	});

	const openCancelInviteDialog = (invitation: Invitation) => {
		setSelectedInvitation(invitation);
		setCancelInviteOpen(true);
	};

	const cancelInvitation = () => {
		if (!selectedInvitation) return;
		cancelInvitationMutation.mutate(selectedInvitation.id);
	};

	return (
		<>
			<Frame className="w-full">
				<Collapsible defaultOpen={false}>
					<FrameHeader className="flex-row items-center justify-between px-2 py-2">
						<CollapsibleTrigger
							className="data-panel-open:[&_svg]:rotate-180"
							render={<Button variant="ghost" />}
						>
							<ChevronDownIcon className="size-4" />
							Pending Invitations
							{pendingInvitations.length > 0 && (
								<Badge variant="outline" className="ml-2">
									{pendingInvitations.length}
								</Badge>
							)}
						</CollapsibleTrigger>
					</FrameHeader>
					<CollapsiblePanel>
						{invitations.length === 0 ? (
							<FramePanel>
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Mail />
										</EmptyMedia>
										<EmptyTitle>Keine ausstehenden Einladungen</EmptyTitle>
										<EmptyDescription>
											Invite members to see pending invitations here.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</FramePanel>
						) : (
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead>E-Mail</TableHead>
										<TableHead>Rolle</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedInvitations.map((invitation) => (
										<TableRow key={invitation.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex size-10 items-center justify-center rounded-full bg-muted">
														<Mail className="size-4 text-muted-foreground" />
													</div>
													<span className="font-medium">
														{invitation.email}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-muted-foreground capitalize">
												{invitation.role}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="capitalize">
													{invitation.status}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												{invitation.status.toLowerCase() === "pending" && (
													<Button
														variant="ghost"
														onClick={() => openCancelInviteDialog(invitation)}
													>
														<X className="size-4" />
														Cancel
													</Button>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CollapsiblePanel>
				</Collapsible>
			</Frame>

			<CancelInvitationDialog
				open={cancelInviteOpen}
				onOpenChange={setCancelInviteOpen}
				email={selectedInvitation?.email}
				onConfirm={cancelInvitation}
				loading={cancelInvitationMutation.isPending}
			/>
		</>
	);
}
