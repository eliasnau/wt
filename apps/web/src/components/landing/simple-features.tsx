import {
	IconChartBar,
	IconCircleQuestion,
	IconKey,
	IconLaptopMobile,
	IconSitemap,
	IconUsers,
} from "nucleo-glass";
import type React from "react";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

type FeatureType = {
	title: string;
	icon: React.ReactNode;
	description: string;
};

const features: FeatureType[] = [
	{
		title: "Auf jedem Gerät",
		description:
			"Greife auf dein Dashboard von Handy, Tablet oder Desktop zu. Optimiert für jede Bildschirmgröße.",
		icon: <IconLaptopMobile />,
	},
	{
		title: "Kursverwaltung",
		description:
			"Organisiere deine Schüler einfach nach Altersgruppen, Gurtstufen oder eigenen Klassen.",
		icon: <IconUsers />,
	},
	{
		title: "Detaillierte Analysen",
		description:
			"Gewinne tiefe Einblicke in deine Leistung mit umfassenden Diagrammen und Berichten.",
		icon: <IconChartBar />,
	},
	{
		title: "Sicher & Zuverlässig",
		description:
			"Sicherheit auf Unternehmensebene hält deine Daten sicher und automatisch gesichert.",
		icon: <IconKey />,
	},
	{
		title: "Einfache Integration",
		description:
			"Verbinde dich mit deinen Lieblingstools und -diensten mit nur wenigen Klicks.",
		icon: <IconSitemap />,
	},
	{
		title: "24/7 Support",
		description:
			"Unser engagiertes Support-Team steht rund um die Uhr zur Verfügung, um dir zum Erfolg zu verhelfen.",
		icon: <IconCircleQuestion />,
	},
];

export function SimpleFeatures() {
	return (
		<section className="py-16 text-center md:py-24">
			<h2 className="text-balance font-medium text-2xl text-foreground md:text-4xl">
				Alles was du für deinen Erfolg brauchst
			</h2>
			<p className="mx-auto mt-4 max-w-[650px] text-balance text-muted-foreground text-sm md:text-base">
				Mit leistungsstarken Funktionen ausgestattet, die dir helfen, dein
				Unternehmen zu wachsen und deinen Arbeitsablauf effizient zu verwalten.
			</p>

			<div className="mt-10 overflow-hidden rounded-lg border">
				<div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
					{features.map((feature) => (
						<FeatureCard feature={feature} key={feature.title} />
					))}
				</div>
			</div>
		</section>
	);
}

function FeatureCard({
	feature,
	className,
	...props
}: React.ComponentProps<"div"> & {
	feature: FeatureType;
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden bg-background p-6 text-left",
				className,
			)}
			{...props}
		>
			<div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
				<GridPattern
					className="absolute inset-0 size-full stroke-foreground/20"
					height={40}
					width={40}
					x={20}
				/>
			</div>
			<div className="[&_svg]:size-6 [&_svg]:text-foreground/75">
				{feature.icon}
			</div>
			<h3 className="mt-10 text-sm md:text-base">{feature.title}</h3>
			<p className="relative z-20 mt-2 font-light text-muted-foreground text-xs">
				{feature.description}
			</p>
		</div>
	);
}
