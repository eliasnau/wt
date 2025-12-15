"use client";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SupportPage() {
	// This page needs to be migrated from Clerk to better-auth
	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-sidebar">
			<div className="w-full max-w-2xl">
				<div className="mb-4">
					<Link
						href={"/" as Route}
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Home
					</Link>
				</div>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel className="text-center py-12">
						<h1 className="font-heading text-2xl mb-4">Support Page</h1>
						<p className="text-muted-foreground mb-6">
							This page is currently being migrated to the new authentication
							system.
						</p>
						<Link href="/dashboard">
							<Button size="lg">Go to Dashboard</Button>
						</Link>
					</FramePanel>
				</Frame>
			</div>
		</div>
	);
}
