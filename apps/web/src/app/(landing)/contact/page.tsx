import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedUnderlineLink } from "@/components/landing/animated-underline-link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { ContactSection } from "@/components/landing/contact-section";
import { LandingHotkeys } from "@/components/hotkeys/landing-hotkeys";
import { getServerSession } from "@/lib/auth";

const LAYOUT_CLASSNAME = "mx-auto max-w-5xl px-6 lg:px-8 xl:px-0";

export const metadata: Metadata = {
	title: "Kontakt",
	description: "Kontaktiere das WT Team für Fragen, Feedback oder Anfragen.",
};

export default async function ContactPage() {
	const session = await getServerSession();
	const isSignedIn = !!session?.user;

	return (
		<div className="relative min-h-screen bg-background">
			<LandingHotkeys />
			<Header className={LAYOUT_CLASSNAME} session={session} />

			<main>
				<section
					className={`${LAYOUT_CLASSNAME} grid min-h-[calc(100vh-10rem)] items-start gap-10 pt-2 pb-6 md:pt-4 md:pb-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16`}
				>
					<div className="flex flex-col gap-8 pt-6 md:pt-10">
						<div className="space-y-4">
							<p className="font-medium text-muted-foreground text-sm">
								Kontakt
							</p>
							<h1 className="max-w-md font-medium text-4xl tracking-tight md:text-6xl">
								Lass uns ein Gespräch starten
							</h1>
							<p className="max-w-xl text-muted-foreground text-lg leading-relaxed">
								Sprich mit uns darüber, wie Matdesk in deinen Alltag passt und
								dein Team bei der Verwaltung entlasten kann.
							</p>
						</div>

						<p className="max-w-lg text-muted-foreground text-lg leading-relaxed">
							Du suchst allgemeine Hilfe?{" "}
							<a
								className="text-foreground underline underline-offset-4 hover:text-primary"
								href="https://docs.matdesk.app"
								rel="noreferrer"
								target="_blank"
							>
								Zum Hilfe-Center
							</a>
						</p>

						<div className="space-y-8 pt-4">
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">E-Mail</p>
								<AnimatedUnderlineLink
									href="mailto:support@matdesk.app"
								>
									support@matdesk.app
								</AnimatedUnderlineLink>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">Telefon</p>
								<AnimatedUnderlineLink
									href="tel:+15551234567"
								>
									+1 (555) 123-4567
								</AnimatedUnderlineLink>
							</div>
						</div>
					</div>

					<div>
						<ContactSection isSignedIn={isSignedIn} />
					</div>
				</section>
			</main>

			<Footer className={LAYOUT_CLASSNAME} />
		</div>
	);
}
