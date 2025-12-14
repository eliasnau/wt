"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { ChangePasswordFrame } from "./_components/change-password-frame";
import { TwoFactorFrame } from "./_components/two-factor-frame";
import { PasskeyFrame } from "./_components/passkey-frame";
import { SessionsFrame } from "./_components/sessions-frame";

export default function SecurityPage() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false;

	return (
		<div className="space-y-6">
			<ChangePasswordFrame />
			<PasskeyFrame />
			<TwoFactorFrame twoFactorEnabled={twoFactorEnabled} />
			<SessionsFrame />
		</div>
	);
}
