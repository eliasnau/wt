"use client";

import { authClient } from "@repo/auth/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
	const [emailParam, setEmailParam] = useQueryState("email");
	const [email, setEmail] = useState(emailParam ?? "");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	// Load email from param and immediately clear it from URL
	useEffect(() => {
		if (emailParam) {
			setEmailParam(null);
		}
	}, [emailParam, setEmailParam]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const { data, error } = await authClient.requestPasswordReset({
			email: email,
			redirectTo: "/reset-password",
		});
		setLoading(false);
		setSent(true);
		toast.success("E-Mail zum Zurücksetzen des Passworts gesendet!");
	};

	if (sent) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="w-full max-w-md">
					<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
						<FramePanel>
							<h1 className="mb-4 font-heading text-2xl">
								Prüfe deine E-Mails
							</h1>
							<p className="mb-6 text-muted-foreground text-sm">
								We've sent a password reset link to <strong>{email}</strong>
							</p>
							<Button
								render={<Link href="/sign-in">Zurück zur Anmeldung</Link>}
								className="w-full"
							/>
						</FramePanel>
					</Frame>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="mb-4">
					<Link
						href={"/sign-in" as Route}
						className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						Zurück zur Anmeldung
					</Link>
				</div>
				<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h1 className="mb-4 font-heading text-2xl">
							Setze dein Passwort zurück
						</h1>
						<p className="mb-6 text-muted-foreground text-sm">
							Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum
							Zurücksetzen deines Passworts.
						</p>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">E-Mail</Label>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
									onChange={(e) => setEmail(e.target.value)}
									value={email}
								/>
							</div>

							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"Link zum Zurücksetzen senden"
								)}
							</Button>
						</form>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-muted-foreground text-sm">
							Erinnerst du dich an dein Passwort?{" "}
							<Link
								href={"/sign-in" as Route}
								className="text-foreground hover:underline"
							>
								Sign in
							</Link>
						</p>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
