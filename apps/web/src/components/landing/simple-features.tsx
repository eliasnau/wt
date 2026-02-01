import { Headphones, Puzzle, ShieldCheck, Zap } from "lucide-react";
import {
	IconChartBar,
	IconCircleQuestion,
	IconKey,
	IconLaptopMobile,
	IconSitemap,
	IconUsers,
} from "nucleo-glass";
import { BlurFade } from "./_components/blur-fade";
import { Card } from "./_components/card";
import { CardWrapper } from "./_components/card-wrapper";
import { Section, SectionContent } from "./_components/section";
import { SectionHeading, SectionSubtitle } from "./_components/typography";

const features = [
	{
		title: "Works on any device",
		description:
			"Access your dashboard from your phone, tablet, or desktop. Optimized for every screen size.",
		icon: <IconLaptopMobile />,
	},
	{
		title: "Class Management",
		description:
			"Easily organize your students into age groups, belt levels, or custom classes for streamlined management.",
		icon: <IconUsers />,
	},
	{
		title: "Advanced Analytics",
		description:
			"Gain deep insights into your performance with comprehensive charts and reports.",
		icon: <IconChartBar />,
	},
	{
		title: "Secure & Reliable",
		description:
			"Enterprise-grade security keeps your data safe and backed up automatically.",
		icon: <IconKey className="size-8 text-green-500" />,
	},
	{
		title: "Easy Integration",
		description:
			"Connect with your favorite tools and services in just a few clicks.",
		icon: <IconSitemap className="size-8 text-purple-500" />,
	},
	{
		title: "24/7 Support",
		description:
			"Our dedicated support team is available around the clock to help you succeed.",
		icon: <IconCircleQuestion className="size-8 text-orange-500" />,
	},
];

export function SimpleFeatures() {
	return (
		<Section>
			<SectionHeading>
				<BlurFade inView>Everything you need to succeed</BlurFade>
			</SectionHeading>
			<SectionSubtitle>
				<BlurFade inView delay={0.25}>
					Packed with powerful features to help you grow your business and
					manage your workflow efficiently.
				</BlurFade>
			</SectionSubtitle>
			<SectionContent
				noMarginTop
				className="mt-10 flex flex-col items-center gap-5 sm:mx-10 md:mx-40 lg:mx-0"
			>
				<CardWrapper className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => (
						<BlurFade
							key={feature.title}
							delay={0.25 + index * 0.1}
							inView
							className="h-full"
						>
							<Card
								title={feature.title}
								description={feature.description}
								icon={feature.icon}
								className="h-full"
							>
								{/* Empty children since Card requires children but we only use header */}
								<div />
							</Card>
						</BlurFade>
					))}
				</CardWrapper>
			</SectionContent>
		</Section>
	);
}
