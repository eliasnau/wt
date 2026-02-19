"use client";

import { Fingerprint } from "lucide-react";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function PasskeyEnableBanner() {
	const handleEnableClick = () => {
		const passkeyFrame = document.querySelector("[data-passkey-frame]");
		if (passkeyFrame) {
			passkeyFrame.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	};

	return (
		<Alert variant="info">
			<Fingerprint />
			<AlertTitle>Einen Passkey hinzufügen</AlertTitle>
			<AlertDescription>
				Use passkeys for faster, more secure sign-ins without passwords.
			</AlertDescription>
			<AlertAction>
				<Button variant="outline" size="sm" onClick={handleEnableClick}>
					Add Passkey
				</Button>
			</AlertAction>
		</Alert>
	);
}
