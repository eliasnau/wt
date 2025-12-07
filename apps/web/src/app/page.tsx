import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import type { Route } from "next";
import Link from "next/link";

export default function Home() {
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
					<SignedIn>
						<Link href={"dashboard" as Route}>
							<Button size="lg">Go to Dashboard</Button>
						</Link>
					</SignedIn>
					<SignedOut>
						<Link href={"sign-in" as Route}>
							<Button size="lg">Get Started</Button>
						</Link>
					</SignedOut>
				</div>
			</div>
		</div>
	);
}
