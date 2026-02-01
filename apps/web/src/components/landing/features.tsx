import Image from "next/image";
import { IconChartBar, IconUsers, IconWalletContent } from "nucleo-glass";
import { BlurFade } from "./_components/blur-fade";
import { CardWrapper } from "./_components/card-wrapper";
import { DisplayCard } from "./_components/display-card";
import { Section, SectionContent } from "./_components/section";
import { SectionHeading, SectionSubtitle } from "./_components/typography";

export function FeaturesSection() {
	return (
		<Section>
			<SectionHeading>
				<BlurFade inView>All the features you need</BlurFade>
			</SectionHeading>
			<SectionSubtitle>
				<BlurFade inView delay={0.25}>
					Flexible enough to fit any workflow. Simple enough to set up in
					minutes.
				</BlurFade>
			</SectionSubtitle>
			<SectionContent
				noMarginTop
				className="mt-5 flex flex-col items-center gap-5 sm:mx-10 md:mx-40 lg:mx-0"
			>
				<CardWrapper className="grid w-full grid-cols-1 gap-5 lg:grid-cols-3">
					<BlurFade inView>
						<DisplayCard
							title="Member Statistics"
							description="Always have an overview of your members and finances. Get clear insights, then take action."
							icon={<IconChartBar />}
						>
							<Image
								src="/images/landing/statistics.svg"
								alt="Statistics"
								width={1000}
								height={400}
							/>
						</DisplayCard>
					</BlurFade>
					<BlurFade delay={0.25} inView>
						<DisplayCard
							title="Manage members with ease"
							description="Powerful tools needed to manage your Members"
							icon={<IconUsers />}
						>
							<Image
								src="/images/landing/manage-members.png"
								alt="Member Management"
								width={1000}
								height={400}
							/>
						</DisplayCard>
					</BlurFade>
					<BlurFade delay={0.25 * 2} inView>
						<DisplayCard
							title="Easy Billing for Your Members"
							description="Seamlessly manage payments to keep your martial arts studio running smoothly."
							icon={<IconWalletContent />}
						>
							<Image
								src="/images/landing/billing.png"
								alt="Finances"
								width={1000}
								height={400}
							/>
						</DisplayCard>
					</BlurFade>
				</CardWrapper>
			</SectionContent>
		</Section>
	);
}
