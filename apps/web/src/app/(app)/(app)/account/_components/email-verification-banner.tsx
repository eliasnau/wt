"use client";

import { authClient } from "@repo/auth/client";
import { Loader2, MailWarning } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner({ email }: { email: string }) {
	const [isSending, setIsSending] = useState(false);

	const handleResendVerification = async () => {
		setIsSending(true);
		try {
			const result = await authClient.sendVerificationEmail({
				email,
				callbackURL: "/account",
			});

			if (result.error) {
				let errorMessage = "Bestätigungs-E-Mail konnte nicht gesendet werden";
				if (result.error.message) {
					errorMessage = result.error.message;
				}
				toast.error(errorMessage);
				setIsSending(false);
				return;
			}

			toast.success(
				"Bestätigungs-E-Mail gesendet! Bitte prüfe deinen Posteingang.",
			);
			setIsSending(false);
		} catch (error) {
			toast.error("Bestätigungs-E-Mail konnte nicht gesendet werden");
			console.error(error);
			setIsSending(false);
		}
	};

	return (
		<Alert variant="warning">
			<MailWarning />
			<AlertTitle>E-Mail nicht verifiziert</AlertTitle>
			<AlertDescription>
				Deine E-Mail-Adresse wurde noch nicht verifiziert. Bitte prüfe deinen
				Posteingang auf einen Bestätigungslink.
			</AlertDescription>
			<AlertAction>
				<Button
					variant="outline"
					size="sm"
					onClick={handleResendVerification}
					disabled={isSending}
				>
					{isSending ? (
						<>
							<Loader2 className="mr-2 size-4 animate-spin" />
							Sending...
						</>
					) : (
						"E-Mail erneut senden"
					)}
				</Button>
			</AlertAction>
		</Alert>
	);
}
