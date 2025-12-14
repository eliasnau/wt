"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { ChangePasswordFrame } from "./_components/change-password-frame";
import { PasskeyFrame } from "./_components/passkey-frame";
import { SessionsFrame } from "./_components/sessions-frame";

export default function SecurityPage() {

	return (
		<div className="space-y-6">
			<ChangePasswordFrame />
			<PasskeyFrame />
			<SessionsFrame />
		</div>
	);
}
