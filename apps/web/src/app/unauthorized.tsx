"use client";

import { LogIn } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";

export default function Unauthorized() {
	const pathname = usePathname();
	const signInUrl = `/sign-in?redirectUrl=${encodeURIComponent(pathname)}`;

	return (
		<div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
			<div className="w-full max-w-md">
				<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
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
								<Button
									render={<Link href={signInUrl as Route}>Anmelden</Link>}
								/>
							</EmptyContent>
						</Empty>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-muted-foreground text-sm">
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
