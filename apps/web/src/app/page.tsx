import { LandingPage } from "@/components/landing-page";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
	const session = await getServerSession();

	if (session?.user) {
		redirect("/dashboard");
	}

	return <LandingPage session={session} />;
}
