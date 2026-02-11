"use client";

import { useState } from "react";
import { MailWarning, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@repo/auth/client";
import { Button } from "@/components/ui/button";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";

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
				toast.error(
					result.error.message || "Bestätigungs-E-Mail konnte nicht gesendet werden",
				);
				return;
			}

			toast.success("Bestätigungs-E-Mail gesendet! Bitte prüfe deinen Posteingang.");
		} catch (error) {
			toast.error("Bestätigungs-E-Mail konnte nicht gesendet werden");
			console.error(error);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Alert variant="warning">
			<MailWarning />
			<AlertTitle>E-Mail nicht verifiziert</AlertTitle>
			<AlertDescription>
				Deine E-Mail-Adresse wurde noch nicht verifiziert. Bitte prüfe deinen Posteingang auf
				einen Bestätigungslink.
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
