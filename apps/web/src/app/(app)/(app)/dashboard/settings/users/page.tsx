"use client";

import { authClient } from "@repo/auth/client";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { InviteMemberDialog } from "./_components/invite-member-dialog";
import { MembersContent } from "./_components/members-content";

export default function MembersSettingsPage() {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const [inviteOpen, setInviteOpen] = useState(false);

	return (
		<>
			<div className="flex flex-col gap-8">
				<Header>
					<HeaderContent>
						<HeaderTitle>Benutzerverwaltung</HeaderTitle>
						<HeaderDescription>
							Manage organization members and their roles
						</HeaderDescription>
					</HeaderContent>
					{activeOrg && (
						<HeaderActions>
							<Button onClick={() => setInviteOpen(true)}>
								<UserPlus className="size-4" />
								Invite User
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
