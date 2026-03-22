"use client";

import { authClient } from "@repo/auth/client";
import { useForm } from "@tanstack/react-form";
import {
	AlertCircle,
	AtSignIcon,
	ChevronLeftIcon,
	KeyRoundIcon,
	Loader2,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Fingerprint } from "@/components/animate-ui/icons/fingerprint";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";

export default function SignIn({
	redirectUrl,
	invite,
}: {
	redirectUrl: string;
	invite: boolean;
}) {
	const router = useRouter();
	const showInvitationEmailBanner = invite;
	const signUpHref = `/sign-up?redirectUrl=${encodeURIComponent(redirectUrl)}${showInvitationEmailBanner ? "&invite=1" : ""}`;

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
					onError: (ctx: { error: { message: string } }) => {
						toast.error(ctx.error.message);
					},
					onSuccess: (ctx: { data: { twoFactorRedirect?: boolean } }) => {
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
				onError: (ctx: { error: { message?: string } }) => {
					toast.error(ctx.error.message || "Passkey authentication failed");
				},
				onSuccess: () => {
					router.push(redirectUrl as Route);
				},
			},
		});
	};

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
				<Logo className="mr-auto h-4.5" monochrome />

				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>

			<div className="relative flex min-h-screen flex-col justify-center px-8 py-10 lg:py-0">
				<div
					aria-hidden
					className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
				>
					<div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
					<div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
					<div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
				</div>

				<Button
					className="absolute top-7 left-5"
					variant="ghost"
					render={<Link href={"/" as Route} />}
				>
					<ChevronLeftIcon data-icon="inline-start" />
					Startseite
				</Button>

				<div className="mx-auto w-full max-w-sm space-y-4">
					<Logo className="h-4.5 lg:hidden" monochrome />
					<div className="flex flex-col space-y-1">
						<h1 className="font-bold text-2xl tracking-wide">Anmelden</h1>
						<p className="text-base text-muted-foreground">
							Melde dich mit deinem Konto an, um weiterzumachen.
						</p>
					</div>

					{showInvitationEmailBanner ? (
						<div className="rounded-lg border border-warning/35 bg-warning/6 px-3 py-2">
							<p className="flex items-start gap-2 text-muted-foreground text-xs leading-relaxed">
								<AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" />
								<span>
									Melde dich mit derselben E-Mail-Adresse an oder erstelle
									damit ein Konto, an die du die Einladung erhalten hast. Falls
									du bereits ein Konto mit einer anderen E-Mail-Adresse hast,
									bitte den Organisations-Admin, die Einladung an diese Adresse
									zu senden.
								</span>
							</p>
						</div>
					) : null}

					<form
						className="space-y-3"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<form.Field
							name="email"
							validators={{
								onBlur: ({ value }) => {
									if (!value) return "E-Mail ist erforderlich";
									if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
										return "Ungültige E-Mail-Adresse";
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-1.5">
									<InputGroup>
										<InputGroupAddon align="inline-start">
											<AtSignIcon />
										</InputGroupAddon>
										<InputGroupInput
											id={field.name}
											name={field.name}
											placeholder="your.email@example.com"
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</InputGroup>
									{field.state.meta.isTouched &&
										!field.state.meta.isValidating &&
										field.state.meta.errors.length > 0 && (
											<p className="text-destructive text-xs">
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
									if (value.length < 8) {
										return "Das Passwort muss mindestens 8 Zeichen lang sein";
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-1.5">
									<div className="flex items-center justify-between gap-3">
										<span className="text-muted-foreground text-xs">
											Passwort
										</span>
										<Link
											href={
												`/forgot-password${form.state.values.email ? `?email=${encodeURIComponent(form.state.values.email)}` : ""}` as Route
											}
											className="text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
										>
											Passwort vergessen?
										</Link>
									</div>
									<InputGroup>
										<InputGroupAddon align="inline-start">
											<KeyRoundIcon />
										</InputGroupAddon>
										<InputGroupInput
											id={field.name}
											name={field.name}
											placeholder="Passwort"
											type="password"
											autoComplete="current-password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</InputGroup>
									{field.state.meta.isTouched &&
										!field.state.meta.isValidating &&
										field.state.meta.errors.length > 0 && (
											<p className="text-destructive text-xs">
												{field.state.meta.errors[0]}
											</p>
										)}
								</div>
							)}
						</form.Field>

						<form.Field name="rememberMe">
							{(field) => (
								<div className="flex items-center gap-2 pt-1">
									<Checkbox
										id={field.name}
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked as boolean)
										}
									/>
									<label
										htmlFor={field.name}
										className="cursor-pointer text-muted-foreground text-sm"
									>
										Angemeldet bleiben
									</label>
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
										"Anmelden"
									)}
								</Button>
							)}
						</form.Subscribe>

						<div className="relative py-1">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									Oder fortfahren mit
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

					<p className="text-muted-foreground text-sm">
						Noch kein Konto?{" "}
						<Link
							href={signUpHref as Route}
							className="underline underline-offset-4 hover:text-primary"
						>
							Konto erstellen
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}
