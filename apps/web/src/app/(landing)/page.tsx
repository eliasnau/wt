import { auth } from "@repo/auth";
import type { Route } from "next";
import { headers } from "next/headers";
import { WordReveal } from "@/components/landing/_components/word-reveal";
import { FeaturesSection } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero, HeroVideoPlayer } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { SimpleFeatures } from "@/components/landing/simple-features";
import { SwitchingSection } from "@/components/landing/switching";
import { cn } from "@/lib/utils";

const LAYOUT_CLASSNAME = "max-w-6xl mx-auto px-6 lg:px-8 xl:px-0";

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return (
		<div>
			{/* <Header className={LAYOUT_CLASSNAME} /> */}
			<main className={cn("isolate", LAYOUT_CLASSNAME)}>
				<Hero
					title={
						<WordReveal
							spaceBetween="w-2 md:w-3"
							words={[
								"The",
								"best",
								"way",
								"to",
								"manage",
								"your",
								// <em key="your">your</em>,
								"Marital",
								"Arts",
								"Studio",
							]}
						/>
					}
					subtitle="A modern member manegment platofrm specifically desgined for martial art studios"
				>
					<HeroVideoPlayer />
					{/* <BrandScroller /> */}
				</Hero>
				<FeaturesSection />
				<SimpleFeatures />
				<SwitchingSection />
				{/* <Pricing /> */}
			</main>
			<Footer className={LAYOUT_CLASSNAME} />
		</div>
	);
}
