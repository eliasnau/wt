import { LandingHotkeys } from "@/components/hotkeys/landing-hotkeys";
import { Footer } from "@/components/landing/footer";
import { FaqsSection } from "@/components/landing/faqs";
import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { SimpleFeatures } from "@/components/landing/simple-features";
import type { getServerSession } from "@/lib/auth";

const LAYOUT_CLASSNAME = "max-w-5xl mx-auto";

interface LandingPageProps {
	session?: Awaited<ReturnType<typeof getServerSession>>;
}

export function LandingPage({ session }: LandingPageProps) {
	return (
		<div>
			<LandingHotkeys />
			<Header className={LAYOUT_CLASSNAME} session={session} />
			<main className={LAYOUT_CLASSNAME}>
				<HeroSection session={session} />
				<div id="features">
					<SimpleFeatures />
				</div>
				{/* <div id="testimonials" className="py-16 md:py-24">
					<TestimonialsSection />
				</div> */}
				<div id="pricing">
					<PricingSection />
				</div>
				{/* <div id="faq">
					<FaqsSection />
				</div> */}
			</main>
			<div id="footer">
				<Footer className={LAYOUT_CLASSNAME} />
			</div>
		</div>
	);
}
