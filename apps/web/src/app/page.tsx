import { Button } from "@/components/ui/button";
import { auth } from "@repo/auth";
import type { Route } from "next";
import Link from "next/link";
import { headers } from "next/headers";

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="text-center">
				<h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
					Welcome
				</h1>
				<p className="mb-8 text-lg text-muted-foreground sm:text-xl">
					Lorem ipsum, dolor sit amet consectetur adipisicing elit.
				</p>
				<div className="flex items-center justify-center gap-4">
					{session ? (
						<Link href={"/dashboard"}>
							<Button size="lg">Go to Dashboard</Button>
						</Link>
					) : (
						<Link href={"sign-in" as Route}>
							<Button size="lg">Get Started</Button>
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
