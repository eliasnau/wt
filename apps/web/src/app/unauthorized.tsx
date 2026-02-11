"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import type { Route } from "next";

export default function Unauthorized() {
	const pathname = usePathname();
	const signInUrl = `/sign-in?redirectUrl=${encodeURIComponent(pathname)}`;

	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-sidebar">
			<div className="w-full max-w-md">
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<LogIn />
								</EmptyMedia>
								<EmptyTitle>Anmeldung erforderlich</EmptyTitle>
								<EmptyDescription>
									You need to be signed in to access this page
								</EmptyDescription>
							</EmptyHeader>
						<EmptyContent>
							<Button render={<Link href={signInUrl as Route}>Anmelden</Link>} />
						</EmptyContent>
						</Empty>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-sm text-muted-foreground">
							Don't have an account?{" "}
							<Link href="/sign-up" className="text-foreground hover:underline">
								Sign up
							</Link>
						</p>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
