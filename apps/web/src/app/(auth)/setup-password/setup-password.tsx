"use client";

import { AlertCircle, ChevronLeftIcon, KeyRoundIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";

type SetupPasswordState = {
	error?: string;
};

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" className="w-full" disabled={pending}>
			{pending ? "Wird gespeichert..." : "Passwort festlegen"}
		</Button>
	);
}

export default function SetupPassword({
	action,
}: {
	action: (
		state: SetupPasswordState,
		formData: FormData,
	) => Promise<SetupPasswordState>;
}) {
	const [state, formAction] = useActionState(action, {});

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
						<h1 className="font-bold text-2xl tracking-wide">
							Passwort festlegen
						</h1>
						<p className="text-base text-muted-foreground">
							Lege ein Passwort fest, damit du dich kuenftig auch mit E-Mail
							und Passwort anmelden kannst.
						</p>
					</div>

					{state.error ? (
						<div className="rounded-lg border border-warning/35 bg-warning/6 px-3 py-2">
							<p className="flex items-start gap-2 text-muted-foreground text-xs leading-relaxed">
								<AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" />
								<span>{state.error}</span>
							</p>
						</div>
					) : null}

					<form action={formAction} className="space-y-3">
						<div className="space-y-1.5">
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<KeyRoundIcon />
								</InputGroupAddon>
								<InputGroupInput
									name="password"
									placeholder="Neues Passwort"
									type="password"
									autoComplete="new-password"
									required
									minLength={8}
								/>
							</InputGroup>
						</div>

						<div className="space-y-1.5">
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<KeyRoundIcon />
								</InputGroupAddon>
								<InputGroupInput
									name="confirmPassword"
									placeholder="Passwort bestaetigen"
									type="password"
									autoComplete="new-password"
									required
									minLength={8}
								/>
							</InputGroup>
						</div>

						<p className="text-muted-foreground text-xs leading-relaxed">
							Dein Passwort muss mindestens 8 Zeichen lang sein.
						</p>

						<SubmitButton />
					</form>
				</div>
			</div>
		</main>
	);
}
