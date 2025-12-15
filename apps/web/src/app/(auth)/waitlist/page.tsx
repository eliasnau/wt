"use client";

import { Frame, FramePanel } from "@/components/ui/frame";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WaitlistPage() {
	// Clerk waitlist component not configured - needs migration to better-auth
	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-sidebar">
			<div className="w-full max-w-md">
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel className="text-center py-12">
						<h1 className="font-heading text-2xl mb-4">Waitlist</h1>
						<p className="text-muted-foreground mb-6">
							This feature is currently being migrated to the new authentication
							system.
						</p>
						<Link href="/sign-in">
							<Button size="lg">Sign In</Button>
						</Link>
					</FramePanel>
				</Frame>
			</div>
		</div>
	);
}
