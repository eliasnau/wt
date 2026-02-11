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
import { authClient } from "@repo/auth/client";
import { useQueryState } from "nuqs";
import posthog from "posthog-js";
import { useForm } from "@tanstack/react-form";

export default function SignUp() {
	const router = useRouter();
	const [redirectUrl] = useQueryState("redirectUrl", {
		defaultValue: "/dashboard",
	});

	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: `${value.firstName} ${value.lastName}`,
				},
				{
					onError: (ctx) => {
						toast.error(ctx.error.message);
					},
					onSuccess: () => {
						posthog.capture("auth:registrieren", {
							auth_method: "email",
						});

						router.push(redirectUrl as Route);
					},
				},
			);
		},
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
						Zur Startseite
					</Link>
				</div>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<h1 className="font-heading text-2xl mb-4">Registrieren</h1>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-3"
						>
							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="firstName"
									validators={{
										onBlur: ({ value }) => {
											if (!value) return "Vorname ist erforderlich";
											if (value.length < 2)
												return "Vorname muss mindestens 2 Zeichen lang sein";
											return undefined;
										},
									}}
								>
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Vorname</Label>
											<Input
												id={field.name}
												name={field.name}
												placeholder="Max"
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
									name="lastName"
									validators={{
										onBlur: ({ value }) => {
											if (!value) return "Nachname ist erforderlich";
											if (value.length < 2)
												return "Nachname muss mindestens 2 Zeichen lang sein";
											return undefined;
										},
									}}
								>
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Nachname</Label>
											<Input
												id={field.name}
												name={field.name}
												placeholder="Robinson"
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
							</div>

							<form.Field
								name="email"
								validators={{
									onBlur: ({ value }) => {
										if (!value) return "E-Mail ist erforderlich";
										if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
											return "Ungültige E-Mail-Adresse";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>E-Mail</Label>
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
										if (!value) return "Passwort ist erforderlich";
										if (value.length < 8)
											return "Das Passwort muss mindestens 8 Zeichen lang sein";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Passwort</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											placeholder="Passwort"
											autoComplete="new-password"
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
											"Konto erstellen"
										)}
									</Button>
								)}
							</form.Subscribe>
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
