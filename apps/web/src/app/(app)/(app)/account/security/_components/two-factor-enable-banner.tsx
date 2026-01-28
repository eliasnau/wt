"use client";

import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";

export function TwoFactorEnableBanner() {
	const handleEnableClick = () => {
		// Scroll to the 2FA frame below
		const twoFactorFrame = document.querySelector("[data-2fa-frame]");
		if (twoFactorFrame) {
			twoFactorFrame.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	};

	return (
		<Alert variant="error">
			<Shield />
			<AlertTitle>Enable Two-Factor Authentication</AlertTitle>
			<AlertDescription>
				Add an extra layer of security to your account by enabling two-factor
				authentication.
			</AlertDescription>
			<AlertAction>
				<Button variant="outline" size="sm" onClick={handleEnableClick}>
					Enable 2FA
				</Button>
			</AlertAction>
		</Alert>
	);
}
