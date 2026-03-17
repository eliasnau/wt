import { LandingHotkeys } from "@/components/hotkeys/landing-hotkeys";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero";
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
				<HeroSection />
				<div id="features">
					<SimpleFeatures />
				</div>
			</main>
			<div id="footer">
				<Footer className={LAYOUT_CLASSNAME} />
			</div>
		</div>
	);
}
