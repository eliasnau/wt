"use client";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Loader2, ArrowLeft, Key } from "lucide-react";
import { authClient } from "@repo/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Route } from "next";
import { useQueryState } from "nuqs";

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const router = useRouter();
	const [redirectUrl] = useQueryState("redirectUrl", {
		defaultValue: "/dashboard",
	});

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="mb-4">
					<Link
						href={"/" as Route}
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Home
					</Link>
				</div>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h1 className="font-heading text-2xl mb-4">Sign In</h1>
						<form className="space-y-3">
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

							<div className="space-y-2">
								<div className="flex items-center">
									<Label htmlFor="password">Password</Label>
									<Link
										href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}` as Route}
										className="ml-auto inline-block text-sm underline"
									>
										Forgot your password?
									</Link>
								</div>

								<Input
									id="password"
									type="password"
									placeholder="password"
									autoComplete="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>

							<div className="flex items-center gap-2">
								<Checkbox
									id="remember"
									onClick={() => setRememberMe(!rememberMe)}
								/>
								<Label htmlFor="remember">Remember me</Label>
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={loading}
								onClick={async () => {
									await authClient.signIn.email(
										{
											email,
											password,
										},
										{
											onRequest: () => {
												setLoading(true);
											},
											onResponse: () => {
												setLoading(false);
											},
											onError: (ctx) => {
												toast.error(ctx.error.message);
											},
											onSuccess: (ctx) => {
												if (ctx.data.twoFactorRedirect) {
													router.push(
														`/verify-2fa?redirectUrl=${encodeURIComponent(redirectUrl)}` as Route,
													);
												} else {
													router.push(redirectUrl as Route);
												}
											},
										},
									);
								}}
							>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"Login"
								)}
							</Button>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-background px-2 text-muted-foreground">
										Or continue with
									</span>
								</div>
							</div>

							<Button
								variant="outline"
								className="w-full gap-2"
								disabled={loading}
								onClick={async () => {
									await authClient.signIn.passkey({
										fetchOptions: {
											onRequest: () => {
												setLoading(true);
											},
											onResponse: () => {
												setLoading(false);
											},
											onError: (ctx) => {
												toast.error(
													ctx.error.message || "Passkey authentication failed",
												);
											},
											onSuccess: () => {
												router.push(redirectUrl as Route);
											},
										},
									});
								}}
							>
								<Key size={16} />
								Passkey
							</Button>
						</form>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-sm text-muted-foreground">
							Don't have an account?{" "}
							<Link
								href={"/sign-up" as Route}
								className="text-foreground hover:underline"
							>
								Sign up
							</Link>
						</p>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
