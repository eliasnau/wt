import {
	ArrowRight,
	Briefcase,
	Building,
	CheckCircle2,
	Sparkles,
	Users,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { cn } from "@/lib/utils";

type Plan = {
	icon: React.ReactNode;
	description: string;
	name: string;
	price: string;
	variant: "outline" | "default";
	features: string[];
	badge?: string;
	original?: string;
	period?: string;
};

const plans: Plan[] = [
	{
		icon: <Users />,
		description: "Ideal für kleine Schulen und neue Standorte",
		name: "Starter",
		price: "25€",
		variant: "outline",
		features: [
			"Bis zu 30 Mitglieder",
			"2 Benutzerkonten",
			"Mitglieder- und Kursverwaltung",
			"Dashboard auf allen Geräten",
			"E-Mail-Support",
		],
		period: "/Monat",
	},
	{
		icon: <Briefcase />,
		description: "Für wachsende Schulen mit mehr Betrieb",
		name: "Pro",
		badge: "Popular",
		price: "50€",
		period: "/Monat",
		variant: "default",
		features: [
			"Bis zu 60 Mitglieder",
			"3 Benutzerkonten",
			"Alles aus Starter",
			"Selbstregistrierung für Mitglieder",
			"Probetermin-Buchung",
		],
	},
	{
		icon: <Building />,
		name: "Business",
		description: "Für etablierte Schulen mit mehreren Gruppen",
		price: "100€",
		period: "/Monat",
		variant: "outline",
		features: [
			"Bis zu 200 Mitglieder",
			"5 Benutzerkonten",
			"Alles aus Pro",
			"Mitgliederbereich",
			"Erweiterte Rollen und Rechte",
		],
	},
];

export function PricingSection() {
	return (
		<section className="w-full py-16 md:py-24">
			<div className="mx-auto mb-4 max-w-md space-y-2">
				<h2 className="text-center font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
					Pläne, die mit deiner Schule wachsen
				</h2>
				<p className="text-center text-muted-foreground text-sm md:text-base">
					Klare Preise für kleine Teams, wachsende Schulen und größere
					Organisationen.
				</p>
			</div>
			{/* Main pricing cards */}
			<div className="mx-auto grid w-full max-w-4xl gap-4 p-6 md:grid-cols-3">
				{plans.map((plan, index) => (
					<PricingCard.Card
						className={cn("w-full max-w-full", index === 1 && "md:scale-105")}
						key={plan.name}
					>
						<PricingCard.Header isPopular={index === 1}>
							<PricingCard.Plan>
								<PricingCard.PlanName>
									{plan.icon}
									<span>{plan.name}</span>
								</PricingCard.PlanName>
								{plan.badge ? (
									<PricingCard.Badge>{plan.badge}</PricingCard.Badge>
								) : null}
							</PricingCard.Plan>
							<PricingCard.Price>
								<PricingCard.MainPrice>{plan.price}</PricingCard.MainPrice>
								{plan.period ? (
									<PricingCard.Period>{plan.period}</PricingCard.Period>
								) : null}
							</PricingCard.Price>
							<Button
								className="w-full font-semibold"
								variant={plan.variant}
							>
								Jetzt starten
							</Button>
						</PricingCard.Header>

						<PricingCard.Body>
							<PricingCard.Description>
								{plan.description}
							</PricingCard.Description>
							<PricingCard.List>
								{plan.features.map((item) => (
									<PricingCard.ListItem className="text-xs" key={item}>
										<CheckCircle2
											aria-hidden="true"
											className="size-4 text-foreground"
										/>
										<span>{item}</span>
									</PricingCard.ListItem>
								))}
							</PricingCard.List>
						</PricingCard.Body>
					</PricingCard.Card>
				))}
			</div>

			{/* Just starting out */}
			<div className="mx-auto mt-6 w-full max-w-4xl px-6">
				<div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-background p-5 sm:flex-row">
					<div className="flex items-center gap-3">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card shadow-xs">
							<Sparkles className="size-4" />
						</div>
						<div>
							<p className="font-medium text-sm">
								Gerade erst am Starten?
							</p>
							<p className="text-muted-foreground text-sm">
								Neue Schulen mit unter 10 Mitgliedern zahlen nur{" "}
								<span className="font-semibold text-foreground">
									5€/Monat
								</span>{" "}
								für die ersten 2 Monate.
							</p>
						</div>
					</div>
					<Button
						className="shrink-0 gap-2 font-semibold"
						variant="outline"
					>
						Jetzt starten
						<ArrowRight className="size-4" />
					</Button>
				</div>
			</div>

			{/* Enterprise */}
			<div className="mx-auto mt-6 w-full max-w-4xl px-6">
				<div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-background p-5 sm:flex-row">
					<div className="flex items-center gap-3">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card shadow-xs">
							<Building className="size-4" />
						</div>
						<div>
							<p className="font-medium text-sm">
								Mehr als 200 Mitglieder?
							</p>
							<p className="text-muted-foreground text-sm">
								Individuelles Angebot mit persönlicher Betreuung,
								eigenen Vereinbarungen und maßgeschneiderten Funktionen.
							</p>
						</div>
					</div>
					<Button
						className="shrink-0 gap-2 font-semibold"
						variant="outline"
					>
						Kontakt aufnehmen
						<ArrowRight className="size-4" />
					</Button>
				</div>
			</div>
		</section>
	);
}
