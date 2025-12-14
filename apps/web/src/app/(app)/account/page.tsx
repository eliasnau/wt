"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { ProfileFrame } from "./_components/profile-frame";
import { DeleteAccountFrame } from "./_components/delete-account-frame";

export default function AccountPage() {
	const { data: session } = authClient.useSession();

	if (!session) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<ProfileFrame
				initialName={session.user?.name || ""}
				initialEmail={session.user?.email || ""}
			/>
			<DeleteAccountFrame />
		</div>
	);
}
