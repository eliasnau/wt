import { CallToAction } from "@/components/landing/call-to-action";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero";
import { LandingHotkeys } from "@/components/hotkeys/landing-hotkeys";
import { SimpleFeatures } from "@/components/landing/simple-features";
// import { SwitchingSection } from "@/components/landing/switching";
// import { FeaturesSection } from "@/components/landing/features";
import { getServerSession } from "@/lib/auth";
const LAYOUT_CLASSNAME = "max-w-5xl mx-auto px-6 lg:px-8 xl:px-0";

export default async function Home() {
  const session = await getServerSession();

  return (
    <div>
      <LandingHotkeys />
      <Header className={LAYOUT_CLASSNAME} session={session} />
      <main className={LAYOUT_CLASSNAME}>
        <HeroSection />
        <div id="features">
          <SimpleFeatures />
        </div>
        {/* <SwitchingSection /> */}
      </main>
      {/*<div id="cta">
        <CallToAction />
      </div>*/}
      <div id="footer">
        <Footer className={LAYOUT_CLASSNAME} />
      </div>
    </div>
  );
}
