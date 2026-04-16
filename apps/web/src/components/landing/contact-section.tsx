import Link from "next/link";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactSectionProps {
	isSignedIn?: boolean;
}

export function ContactSection({ isSignedIn = false }: ContactSectionProps) {
	return (
		<div className="relative mx-auto w-full max-w-lg border">
			<div className="px-6 py-8">
				{isSignedIn ? (
					<div className="flex min-h-96 items-center justify-center text-center">
						<p className="max-w-sm text-muted-foreground text-sm leading-relaxed md:text-base">
							Du bist bereits angemeldet. Für Produktfragen und schnellere
							Rückmeldungen nutze bitte den dedizierten{" "}
							<a
								className="text-foreground underline underline-offset-4 hover:text-primary"
								href="https://docs.matdesk.app"
								rel="noreferrer"
								target="_blank"
							>
								Support-Bereich
							</a>
							.
						</p>
					</div>
				) : (
					<>
						<div className="mb-8 flex flex-col gap-2">
							<h2 className="font-semibold text-lg md:text-xl">
								Sprich mit unserem Team
							</h2>
							<p className="text-muted-foreground text-sm md:text-base">
								Füll das Formular aus und wir melden uns innerhalb von 24
								Stunden.{" "}
								<Link
									className="text-foreground underline underline-offset-4 hover:text-primary"
									href="/sign-in"
								>
									Melde dich an
								</Link>
								, wenn du bereits Matdesk nutzt und Support direkt im Produkt
								brauchst.
							</p>
						</div>
						<ContactForm />
					</>
				)}
			</div>
			<DecorIcon position="top-left" />
			<DecorIcon position="top-right" />
			<DecorIcon position="bottom-left" />
			<DecorIcon position="bottom-right" />
		</div>
	);
}

function ContactForm() {
	return (
		<form className="w-full">
			<FieldGroup>
				<div className="grid grid-cols-2 gap-4">
					<Field>
						<FieldLabel htmlFor="first-name">Vorname</FieldLabel>
						<Input autoComplete="off" id="first-name" placeholder="Max" />
					</Field>
					<Field>
						<FieldLabel htmlFor="last-name">Nachname</FieldLabel>
						<Input autoComplete="off" id="last-name" placeholder="Mustermann" />
					</Field>
				</div>
				<Field>
					<FieldLabel htmlFor="email">E-Mail</FieldLabel>
					<Input
						autoComplete="off"
						id="email"
						placeholder="max@beispiel.de"
						type="email"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="phone">Telefon</FieldLabel>
					<Input
						autoComplete="off"
						id="phone"
						placeholder="+1 (555) 123-4567"
						type="tel"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="message">Nachricht</FieldLabel>
					<Textarea
						autoComplete="off"
						id="message"
						placeholder="Deine Nachricht"
					/>
				</Field>
			</FieldGroup>
			<Button className="mt-8 w-full" type="button">
				Absenden
			</Button>
		</form>
	);
}
