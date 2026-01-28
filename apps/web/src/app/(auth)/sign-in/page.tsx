"use client";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft } from "lucide-react";
import { authClient } from "@repo/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Route } from "next";
import { useQueryState } from "nuqs";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Fingerprint } from "@/components/animate-ui/icons/fingerprint";
import posthog from "posthog-js";
import { useForm } from "@tanstack/react-form";

export default function SignIn() {
	const router = useRouter();
	const [redirectUrl] = useQueryState("redirectUrl", {
		defaultValue: "/dashboard",
	});

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onError: (ctx) => {
						toast.error(ctx.error.message);
					},
					onSuccess: (ctx) => {
						posthog.capture("auth:sign_in", {
							auth_method: "email",
							has_two_factor: !!ctx.data.twoFactorRedirect,
						});

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
		},
	});

	const handlePasskeySignIn = async () => {
		await authClient.signIn.passkey({
			fetchOptions: {
				onError: (ctx) => {
					toast.error(ctx.error.message || "Passkey authentication failed");
				},
				onSuccess: () => {
					posthog.capture("auth:sign_in", {
						auth_method: "passkey",
					});

					router.push(redirectUrl as Route);
				},
			},
		});
	};

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
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-3"
						>
							<form.Field
								name="email"
								validators={{
									onBlur: ({ value }) => {
										if (!value) return "Email is required";
										if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
											return "Invalid email address";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											placeholder="m@example.com"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.isTouched &&
											!field.state.meta.isValidating &&
											field.state.meta.errors.length > 0 && (
												<p className="text-xs text-destructive">
													{field.state.meta.errors[0]}
												</p>
											)}
									</div>
								)}
							</form.Field>

							<form.Field
								name="password"
								validators={{
									onBlur: ({ value }) => {
										if (!value) return "Password is required";
										if (value.length < 8)
											return "Password must be at least 8 characters";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<div className="flex items-center">
											<Label htmlFor={field.name}>Password</Label>
											<Link
												href={
													`/forgot-password${form.state.values.email ? `?email=${encodeURIComponent(form.state.values.email)}` : ""}` as Route
												}
												className="ml-auto inline-block text-sm underline"
											>
												Forgot your password?
											</Link>
										</div>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											placeholder="password"
											autoComplete="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.isTouched &&
											!field.state.meta.isValidating &&
											field.state.meta.errors.length > 0 && (
												<p className="text-xs text-destructive">
													{field.state.meta.errors[0]}
												</p>
											)}
									</div>
								)}
							</form.Field>

							<form.Field name="rememberMe">
								{(field) => (
									<div className="flex items-center gap-2">
										<Checkbox
											id={field.name}
											checked={field.state.value}
											onCheckedChange={(checked) =>
												field.handleChange(checked as boolean)
											}
										/>
										<Label htmlFor={field.name}>Remember me</Label>
									</div>
								)}
							</form.Field>

							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										className="w-full"
										disabled={!canSubmit || isSubmitting}
									>
										{isSubmitting ? (
											<Loader2 size={16} className="animate-spin" />
										) : (
											"Login"
										)}
									</Button>
								)}
							</form.Subscribe>

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
							<AnimateIcon animateOnHover>
								<Button
									type="button"
									variant="outline"
									className="w-full gap-2"
									disabled={form.state.isSubmitting}
									onClick={handlePasskeySignIn}
								>
									<Fingerprint size={16} />
									Passkey
								</Button>
							</AnimateIcon>
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
