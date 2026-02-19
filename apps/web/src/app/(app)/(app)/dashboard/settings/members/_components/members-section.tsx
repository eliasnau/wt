"use client";

import { authClient } from "@repo/auth/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame } from "@/components/ui/frame";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { RemoveMemberDialog, RoleChangeDialog } from "./confirm-dialogs";
import { formatRoleLabel } from "./role-utils";
import { useOrgRoles } from "./use-org-roles";

type Member = {
	id: string;
	role: string;
	user: {
		name?: string;
		email: string;
		image?: string;
	};
};

export function MembersSection() {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
	const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);
	const [pendingRole, setPendingRole] = useState("");
	const { roleOptions } = useOrgRoles();

	const { data: membersData, refetch } = useQuery({
		queryKey: ["organization-members", activeOrg?.id],
		retry: 1,
		queryFn: async () => {
			const result = await authClient.organization.listMembers({
				query: { limit: 100 },
			});

			if (result.error) {
				throw new Error(
					result.error.message || "Mitglieder konnten nicht geladen werden",
				);
			}

			return result.data;
		},
		enabled: !!activeOrg,
	});

	const members = membersData?.members || [];

	const updateRoleMutation = useMutation({
		mutationFn: async ({
			memberId,
			role,
		}: {
			memberId: string;
			role: string;
		}) => {
			const result = await authClient.organization.updateMemberRole({
				memberId,
				role,
			});
			if (result.error) {
				throw new Error(
					result.error.message || "Rolle konnte nicht aktualisiert werden",
				);
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Rolle aktualisiert");
			refetch();
			setRoleConfirmOpen(false);
			setSelectedMember(null);
			setPendingRole("");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "Rolle konnte nicht aktualisiert werden",
			);
			setRoleConfirmOpen(false);
			setSelectedMember(null);
			setPendingRole("");
		},
	});

	const removeMemberMutation = useMutation({
		mutationFn: async (memberId: string) => {
			const result = await authClient.organization.removeMember({
				memberIdOrEmail: memberId,
			});
			if (result.error) {
				throw new Error(
					result.error.message || "Mitglied konnte nicht entfernt werden",
				);
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Member removed");
			refetch();
			setRemoveConfirmOpen(false);
			setSelectedMember(null);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "Mitglied konnte nicht entfernt werden",
			);
			setRemoveConfirmOpen(false);
			setSelectedMember(null);
		},
	});

	const openRoleConfirmDialog = (member: Member, newRole: string) => {
		if (newRole === member.role) return;

		setSelectedMember(member);
		setPendingRole(newRole);
		setRoleConfirmOpen(true);
	};

	const updateMemberRole = () => {
		if (!selectedMember || !pendingRole) return;
		updateRoleMutation.mutate({
			memberId: selectedMember.id,
			role: pendingRole,
		});
	};

	const openRemoveConfirmDialog = (member: Member) => {
		setSelectedMember(member);
		setRemoveConfirmOpen(true);
	};

	const removeMember = () => {
		if (!selectedMember) return;
		removeMemberMutation.mutate(selectedMember.id);
	};

	if (members.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<User />
					</EmptyMedia>
					<EmptyTitle>Noch keine Mitglieder</EmptyTitle>
					<EmptyDescription>
						Invite members to your organization to get started.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<>
			<Frame className="w-full">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead>Mitglied</TableHead>
							<TableHead>E-Mail</TableHead>
							<TableHead>Rolle</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{members.map((member) => (
							<TableRow key={member.id}>
								<TableCell>
									<div className="flex items-center gap-3">
										<Avatar>
											<AvatarImage
												alt={member.user.name || "User"}
												src={
													member.user.image ||
													`https://avatar.vercel.sh/${member.user.id}` ||
													undefined
												}
											/>
											<AvatarFallback>
												<User className="size-4" />
											</AvatarFallback>
										</Avatar>
										<span className="font-medium">
											{member.user.name || "Unknown User"}
										</span>
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{member.user.email}
								</TableCell>
								<TableCell>
									<Select
										value={member.role}
										onValueChange={(value) =>
											value && openRoleConfirmDialog(member, value)
										}
									>
										<SelectTrigger className="w-[170px]">
											<SelectValue placeholder={formatRoleLabel(member.role)} />
										</SelectTrigger>
										<SelectContent>
											{roleOptions.map((roleOption) => (
												<SelectItem key={roleOption} value={roleOption}>
													{formatRoleLabel(roleOption)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell className="text-right">
									<Button
										variant="destructive"
										onClick={() => openRemoveConfirmDialog(member)}
									>
										Remove
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Frame>

			<RoleChangeDialog
				open={roleConfirmOpen}
				onOpenChange={setRoleConfirmOpen}
				memberName={selectedMember?.user.name}
				currentRole={selectedMember?.role}
				newRole={pendingRole}
				onConfirm={updateMemberRole}
				loading={updateRoleMutation.isPending}
			/>

			<RemoveMemberDialog
				open={removeConfirmOpen}
				onOpenChange={setRemoveConfirmOpen}
				memberName={selectedMember?.user.name}
				onConfirm={removeMember}
				loading={removeMemberMutation.isPending}
			/>
		</>
	);
}
