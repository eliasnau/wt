"use client";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Route } from "next";
import { useQueryState } from "nuqs";
import { authClient } from "@repo/auth/client";

export default function ForgotPassword() {
	const [emailParam, setEmailParam] = useQueryState("email");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	// Load email from param and immediately clear it from URL
	useEffect(() => {
		if (emailParam) {
			setEmail(emailParam);
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
		toast.success("Password reset email sent!");
	};

	if (sent) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="w-full max-w-md">
					<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
						<FramePanel>
							<h1 className="font-heading text-2xl mb-4">Check your email</h1>
							<p className="text-sm text-muted-foreground mb-6">
								We've sent a password reset link to <strong>{email}</strong>
							</p>
							<Button
								render={<Link href="/sign-in">Back to Sign In</Link>}
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
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Sign In
					</Link>
				</div>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h1 className="font-heading text-2xl mb-4">Reset your password</h1>
						<p className="text-sm text-muted-foreground mb-6">
							Enter your email address and we'll send you a link to reset your
							password.
						</p>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
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
									"Send reset link"
								)}
							</Button>
						</form>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-sm text-muted-foreground">
							Remember your password?{" "}
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
