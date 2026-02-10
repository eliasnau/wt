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
					result.error.message || "Failed to send verification email",
				);
				return;
			}

			toast.success("Verification email sent! Please check your inbox.");
		} catch (error) {
			toast.error("Failed to send verification email");
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
				Your email address hasn't been verified yet. Please check your inbox for
				a verification link.
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
						"Resend Email"
					)}
				</Button>
			</AlertAction>
		</Alert>
	);
}
