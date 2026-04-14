import {
	IconChartBar,
	IconCircleQuestion,
	IconKey,
	IconLaptopMobile,
	IconSitemap,
	IconUsers,
} from "nucleo-glass";
import type React from "react";
import { DecorIcon } from "@/components/ui/decor-icon";
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
		<div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-12 px-4 py-12 md:px-8">
			<div className="mx-auto max-w-md space-y-2 text-center">
				<h2 className="font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
					Alles was du für deinen Erfolg brauchst
				</h2>
				<p className="text-muted-foreground text-sm md:text-base">
					Mit leistungsstarken Funktionen ausgestattet, die dir helfen, dein
					Unternehmen zu wachsen und deinen Arbeitsablauf effizient zu
					verwalten.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{features.map((feature) => (
					<FeatureCard feature={feature} key={feature.title} />
				))}
			</div>
		</div>
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
				"relative flex flex-col justify-between gap-6 bg-background px-6 pt-8 pb-6 shadow-xs",
				"dark:bg-[radial-gradient(50%_80%_at_25%_0%,--theme(--color-foreground/.1),transparent)]",
				className,
			)}
			{...props}
		>
			<DecorIcon className="size-3.5" position="top-left" />

			<div className="absolute -inset-y-4 -left-px w-px bg-border" />
			<div className="absolute -inset-y-4 -right-px w-px bg-border" />
			<div className="absolute -inset-x-4 -top-px h-px bg-border" />
			<div className="absolute -right-4 -bottom-px -left-4 h-px bg-border" />

			<div
				className={cn(
					"relative z-10 flex w-fit items-center justify-center rounded-lg border bg-muted/20 p-3",
					"[&_svg]:size-5 [&_svg]:stroke-[1.5] [&_svg]:text-foreground",
				)}
			>
				{feature.icon}
			</div>

			<div className="relative z-10 space-y-2">
				<h3 className="font-medium text-base text-foreground">
					{feature.title}
				</h3>
				<p className="text-muted-foreground text-xs leading-relaxed">
					{feature.description}
				</p>
			</div>
		</div>
	);
}
