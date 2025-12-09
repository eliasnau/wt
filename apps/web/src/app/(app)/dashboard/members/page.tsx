"use client";

import { useState } from "react";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "@/app/(app)/dashboard/_components/page-header";
import { MembersTable } from "./_components/members-table";
import { GenerateQRSheet } from "./_components/generate-qr-sheet";
import { CreateMemberButton } from "./_components/create-member-button";

export default function MembersPage() {
	const [qrSheetOpen, setQrSheetOpen] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<Header>
				<HeaderContent>
					<HeaderTitle>Members</HeaderTitle>
					<HeaderDescription>
						Manage your organization members and their roles
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<CreateMemberButton />
				</HeaderActions>
			</Header>

			<MembersTable />

			<GenerateQRSheet open={qrSheetOpen} onOpenChange={setQrSheetOpen} />
		</div>
	);
}
