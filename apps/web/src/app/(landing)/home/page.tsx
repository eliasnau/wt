import { LandingPage } from "@/components/landing-page";
import { getServerSession } from "@/lib/auth";

export default async function HomePage() {
	const session = await getServerSession();

	return <LandingPage session={session} />;
}
