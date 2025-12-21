"use client";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { authClient } from "@repo/auth/client";
import { useQueryState } from "nuqs";

export default function SignUp() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [redirectUrl] = useQueryState("redirectUrl", {
		defaultValue: "/dashboard",
	});

	return (
		<div className="flex min-h-screen items-start md:items-center justify-center p-4">
			<div className="w-full max-w-md my-4 md:my-0">
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
						<h1 className="font-heading text-2xl mb-4">Sign Up</h1>
						<form className="space-y-3">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="first-name">First name</Label>
									<Input
										id="first-name"
										placeholder="Max"
										required
										onChange={(e) => setFirstName(e.target.value)}
										value={firstName}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="last-name">Last name</Label>
									<Input
										id="last-name"
										placeholder="Robinson"
										required
										onChange={(e) => setLastName(e.target.value)}
										value={lastName}
									/>
								</div>
							</div>
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
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									autoComplete="new-password"
									placeholder="Password"
								/>
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={loading}
								onClick={async () => {
									await authClient.signUp.email(
										{
											email,
											password,
											name: `${firstName} ${lastName}`,
										},
										{
											onResponse: () => {
												setLoading(false);
											},
											onRequest: () => {
												setLoading(true);
											},
											onError: (ctx) => {
												toast.error(ctx.error.message);
											},
											onSuccess: () => {
												router.push(redirectUrl as Route);
											},
										},
									);
								}}
							>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"Create an account"
								)}
							</Button>
						</form>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
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
