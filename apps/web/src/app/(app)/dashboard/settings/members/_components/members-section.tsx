"use client";

import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Frame } from "@/components/ui/frame";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Empty,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";
import { authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { RoleChangeDialog, RemoveMemberDialog } from "./confirm-dialogs";

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
	const [loading, setLoading] = useState(false);

	const { data: membersData, refetch } = useQuery({
		queryKey: ["organization-members", activeOrg?.id],
		retry: 1,
		queryFn: async () => {
			const result = await authClient.organization.listMembers({
				query: { limit: 100 },
			});

			if (result.error) {
				throw new Error(result.error.message || "Failed to load members");
			}

			return result.data;
		},
		enabled: !!activeOrg,
	});

	const members = membersData?.members || [];

	const openRoleConfirmDialog = (member: Member, newRole: string) => {
		if (newRole === member.role) return;

		setSelectedMember(member);
		setPendingRole(newRole);
		setRoleConfirmOpen(true);
	};

	const updateMemberRole = async () => {
		if (!selectedMember || !pendingRole) return;

		setLoading(true);
		const result = await authClient.organization.updateMemberRole({
			memberId: selectedMember.id,
			role: pendingRole,
		});
		setLoading(false);

		setRoleConfirmOpen(false);
		setSelectedMember(null);
		setPendingRole("");

		if (result.error) {
			toast.error(result.error.message || "Failed to update role");
			return;
		}

		toast.success("Role updated");
		refetch();
	};

	const openRemoveConfirmDialog = (member: Member) => {
		setSelectedMember(member);
		setRemoveConfirmOpen(true);
	};

	const removeMember = async () => {
		if (!selectedMember) return;

		setLoading(true);
		const result = await authClient.organization.removeMember({
			memberIdOrEmail: selectedMember.id,
		});
		setLoading(false);

		setRemoveConfirmOpen(false);
		setSelectedMember(null);

		if (result.error) {
			toast.error(result.error.message || "Failed to remove member");
			return;
		}

		toast.success("Member removed");
		refetch();
	};

	if (members.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<User />
					</EmptyMedia>
					<EmptyTitle>No members yet</EmptyTitle>
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
							<TableHead>Member</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
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
												src={member.user.image || undefined}
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
											openRoleConfirmDialog(member, value)
										}
									>
										<SelectTrigger className="w-[140px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="member">Member</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="owner">Owner</SelectItem>
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
				loading={loading}
			/>

			<RemoveMemberDialog
				open={removeConfirmOpen}
				onOpenChange={setRemoveConfirmOpen}
				memberName={selectedMember?.user.name}
				onConfirm={removeMember}
				loading={loading}
			/>
		</>
	);
}
