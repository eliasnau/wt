"use client";

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { authClient } from "@repo/auth/client";
import {
	Header,
	HeaderContent,
	HeaderTitle,
	HeaderDescription,
	HeaderActions,
} from "../../_components/page-header";
import { MembersContent } from "./_components/members-content";
import { InviteMemberDialog } from "./_components/invite-member-dialog";

export default function MembersSettingsPage() {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const [inviteOpen, setInviteOpen] = useState(false);

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

			<InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
		</>
	);
}
