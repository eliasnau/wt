"use client";

import {
	Header,
	HeaderContent,
	HeaderTitle,
	HeaderDescription,
	HeaderActions,
} from "../../_components/page-header";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import { authClient } from "@repo/auth/client";
import { useState } from "react";
import { toast } from "sonner";
import { MembersContent } from "./_components/members-content";
import { InviteMemberDialog } from "./_components/invite-member-dialog";

export default function MembersSettingsPage() {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const [inviteOpen, setInviteOpen] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("member");
	const [loading, setLoading] = useState(false);

	const inviteMember = async () => {
		if (!inviteEmail.trim()) {
			toast.error("Email is required");
			return;
		}

		setLoading(true);
		const result = await authClient.organization.inviteMember({
			email: inviteEmail,
			role: inviteRole,
		});
		setLoading(false);

		if (result.error) {
			toast.error(result.error.message || "Failed to send invitation");
			return;
		}

		toast.success("Invitation sent");
		setInviteOpen(false);
		setInviteEmail("");
		setInviteRole("member");
		window.location.reload();
	};

	return (
		<>
			<div className="flex flex-col gap-8">
				<Header>
					<HeaderContent>
						<HeaderTitle>Members</HeaderTitle>
						<HeaderDescription>
							Manage organization members and their roles
						</HeaderDescription>
					</HeaderContent>
					{activeOrg && (
						<HeaderActions>
							<Button onClick={() => setInviteOpen(true)}>
								<UserPlus className="size-4" />
								Invite Member
							</Button>
						</HeaderActions>
					)}
				</Header>

				<MembersContent />
			</div>

			<InviteMemberDialog
				open={inviteOpen}
				onOpenChange={setInviteOpen}
				email={inviteEmail}
				onEmailChange={setInviteEmail}
				role={inviteRole}
				onRoleChange={setInviteRole}
				onSubmit={inviteMember}
				loading={loading}
			/>
		</>
	);
}
