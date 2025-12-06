import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import type { Route } from "next";
import Link from "next/link";

export default function Home() {
	return (
		<div>
			<SignedIn><Link href={'dashboard' as Route}><Button>Dashboard</Button></Link></SignedIn>
			<SignedOut><Link href={'dashboard' as Route}><Button>Login</Button></Link></SignedOut>
		</div>
	);
}