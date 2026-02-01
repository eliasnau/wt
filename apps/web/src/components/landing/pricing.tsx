"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import {
	IconBadgeSparkle,
	IconBolt,
	IconCalendar,
	IconMsgs,
	IconSparkle,
	IconSparkle2,
	IconSuitcase,
} from "nucleo-glass";
import type { PostHog } from "posthog-js";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { Badge, type BadgeVariant } from "./_components/badge";
import { BlurFade } from "./_components/blur-fade";
import { Button, type ButtonVariant } from "./_components/button";
import { Card, CardContent } from "./_components/card";
import { CardWrapper } from "./_components/card-wrapper";
import { Section, SectionContent } from "./_components/section";
import {
	Paragraph,
	SectionHeading,
	SectionSubtitle,
	Subheading,
} from "./_components/typography";

type Tier = {
	name: string;
	description: string;
	price: {
		monthly: string | null;
		annually: string | null;
	};
	features: {
		text: string;
	}[];
};

const tiers: Tier[] = [
	{
		name: "Starter",
		description:
			"Good for anyone who is self-employed and just getting started.",
		price: {
			monthly: "24",
			annually: "20",
		},
		features: [
			{ text: "Up to 150 members" },
			{ text: "2 Users" },
			{ text: "Free Support" },
		],
	},
	{
		name: "Pro",
		description: "Perfect for small teams and growing businesses.",
		price: {
			monthly: "50",
			annually: "42",
		},
		features: [
			{ text: "Everything in Starter plus:" },
			{ text: "Up to 500 Members" },
			{ text: "Up to 5 user accounts" },
			{ text: "Member Portal" },
			{ text: "Free Priority support" },
		],
	},
	{
		name: "Enterprise",
		description: "For large organizations with specific needs.",
		price: {
			monthly: null,
			annually: null,
		},
		features: [
			{ text: "Unlimited Members" },
			{ text: "Unlimited user accounts" },
			{ text: "Custom Branding" },
			{ text: "Member Portal" },
			{ text: "Dedicated support" },
		],
	},
];

type PricingTier = Tier & {
	badges?: {
		message: string;
		variant?: BadgeVariant;
		annualOnly?: boolean;
	}[];
	button: {
		content: string;
		variant?: ButtonVariant;
		icon?: React.ReactNode;
		href: string;
		target?: string;
	};
	icon: React.ReactNode;
};

const pricingTiers: PricingTier[] = [
	{
		...tiers[0],
		badges: [{ message: "Save 16%", annualOnly: true }],
		button: {
			content: "Get started now",
			href: "/sign-up",
		},
		icon: <IconSuitcase />,
	},
	{
		...tiers[1],
		badges: [
			{ message: "Save 16%", annualOnly: true },
			{ message: "Popular", variant: "green" },
		],
		button: {
			variant: "secondary-two",
			content: "Get started now",
			href: "/sign-up",
		},
		icon: <IconBolt />,
	},
	{
		...tiers[2],
		button: {
			variant: "secondary-two",
			content: "Speak to sales",
			icon: <IconMsgs />,
			href: "/sales",
			target: "_blank",
		},
		icon: <IconSparkle />,
	},
];

const frequencies = ["annually", "monthly"];

export function Pricing() {
	const [frequency, setFrequency] = useState(frequencies[0]);
	const posthog = usePostHog();

	return (
		<Section id="pricing">
			<SectionHeading>
				<BlurFade inView>
					<span className="font-heading">Simple, transparent pricing</span>
				</BlurFade>
			</SectionHeading>
			<SectionSubtitle>
				<BlurFade inView delay={0.25}>
					No hidden fees. Cancel anytime.
				</BlurFade>
			</SectionSubtitle>
			<SectionContent
				noMarginTop
				className="mt-6 flex flex-col items-center justify-center"
			>
				<div className="mb-6 w-fit rounded-full p-1.5 font-semibold text-xs leading-5 shadow-[0_0_7px_0_rgba(0,0,0,0.0.07)] ring-1 ring-gray-200 ring-inset">
					<Label className="sr-only">Payment frequency</Label>
					<div className="flex gap-1">
						{frequencies.map((value) => {
							const checked = frequency === value;
							return (
								<button
									key={value}
									onClick={() => setFrequency(value)}
									className={cn(
										checked ? "bg-black text-white" : "text-gray-500",
										"cursor-pointer rounded-full border-0 px-6 py-1 transition-colors focus:outline-none",
									)}
								>
									<span className="font-heading">
										{value.charAt(0).toUpperCase() + value.slice(1)}
									</span>
								</button>
							);
						})}
					</div>
				</div>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{pricingTiers.map((tier, index) => (
						<BlurFade
							key={tier.name}
							delay={0.25 + index * 0.1}
							inView
							className="h-full"
						>
							<CardWrapper className="h-full">
								<PricingCard
									tier={tier}
									tierIndex={index}
									isAnnual={frequency === "annually"}
									posthog={posthog}
								/>
							</CardWrapper>
						</BlurFade>
					))}
				</div>
			</SectionContent>
			<SectionContent className="mt-20">
				<BlurFade inView>
					<CardWrapper className="p-8">
						<div className="flex flex-col items-center justify-between gap-8 md:flex-row">
							<div className="flex-1 space-y-4">
								<h3 className="font-bold font-heading text-2xl">
									Just starting your Dojo?
								</h3>
								<Paragraph>
									We offer a special plan designed for new studios just getting
									started. If you have fewer than 25 members, get your{" "}
									<strong className="font-semibold text-gray-900">
										first month free
									</strong>
									, followed by a discounted rate for the next 4 months.
								</Paragraph>
							</div>
							<div>
								<Button variant="secondary" size="lg" asChild>
									<Link href={"/apply-starting-discount" as any}>
										<IconSparkle2 />
										Apply for discount
									</Link>
								</Button>
							</div>
						</div>
					</CardWrapper>
				</BlurFade>
			</SectionContent>
			<SectionContent className="mt-20">
				<BlurFade inView>
					<div className="relative overflow-hidden rounded-[32px] border border-[#E7E7E7] bg-white px-6 py-12 text-center shadow-sm sm:px-12 md:py-16">
						<div className="relative z-10 flex flex-col items-center gap-6">
							<div className="text-blue-600">
								<IconMsgs className="h-10 w-10" />
							</div>
							<div className="max-w-2xl space-y-4">
								<h3 className="font-bold font-heading text-3xl text-gray-900 md:text-4xl">
									Still have questions?
								</h3>
								<Paragraph className="text-lg">
									We understand that choosing the right software is a big
									decision. We're confident you'll love it, so book a
									personalized demo and we'll show you exactly how we can help
									your studio grow.
								</Paragraph>
							</div>
							<div className="mt-4">
								<Button size="lg" asChild>
									<Link href={"/demo" as any}>Schedule a demo</Link>
								</Button>
							</div>
						</div>
						{/* Subtle background decoration */}
						<div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-20 [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
					</div>
				</BlurFade>
			</SectionContent>
		</Section>
	);
}

interface PricingCardProps {
	tier: PricingTier;
	tierIndex: number;
	isAnnual: boolean;
	posthog: PostHog;
}

function PricingCard({ tier, tierIndex, isAnnual, posthog }: PricingCardProps) {
	const { name, description, features } = tier;
	const price = isAnnual ? tier.price.annually : tier.price.monthly;
	const isFirstTier = !tierIndex;

	return (
		<Card
			title={name}
			description={description}
			icon={tier.icon}
			variant="extra-rounding"
			addon={
				<div className="flex h-0 items-center gap-1.5">
					{tier.badges
						?.filter(({ annualOnly }) => !annualOnly || isAnnual)
						.map((badge) => (
							<Badge key={badge.message} variant={badge.variant}>
								{badge.message}
							</Badge>
						))}
				</div>
			}
			className="h-full"
		>
			<div className="px-6 pt-0 pb-6">
				<div className="space-y-6">
					<div className="flex items-end gap-2">
						{price ? (
							<>
								<Subheading>${price}</Subheading>
								<Paragraph size="xs" color="light" className="-translate-y-1">
									/month (billed {isAnnual ? "annually" : "monthly"})
								</Paragraph>
							</>
						) : (
							<Subheading>Contact us</Subheading>
						)}
					</div>
					<Button auto size="lg" variant={tier.button.variant} asChild>
						<Link href={tier.button.href as any} target={tier.button.target}>
							{tier.button.icon}
							{/* z-10 keeps text above gradient background on hover to prevent color shift */}
							<span className="relative z-10">{tier.button.content}</span>
						</Link>
					</Button>
				</div>
			</div>
			<CardContent className="border-[#E7E7E780] border-t">
				{isFirstTier ? null : (
					<Paragraph size="sm" className="mb-4 font-medium">
						{tier.features[0].text}
					</Paragraph>
				)}
				<ul className="space-y-3">
					{features
						.filter((_, index) => !!isFirstTier || index > 0)
						.map((feature) => (
							<li
								className="flex items-center gap-2 text-gray-500 text-sm"
								key={feature.text}
							>
								<div className="text-blue-500">
									<Check />
								</div>
								{feature.text}
							</li>
						))}
				</ul>
			</CardContent>
		</Card>
	);
}
