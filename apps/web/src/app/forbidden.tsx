"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
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

export default function Forbidden() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-sidebar">
			<div className="w-full max-w-md">
				<div className="mb-4">
					<Link
						href="/dashboard"
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Zurück zum Dashboard
					</Link>
				</div>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<ShieldAlert />
								</EmptyMedia>
								<EmptyTitle>Zugriff verweigert</EmptyTitle>
								<EmptyDescription>
									Du hast keine Berechtigung, auf diese Seite zuzugreifen
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button
									render={<Link href="/dashboard">Zum Dashboard</Link>}
								/>
							</EmptyContent>
						</Empty>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-sm text-muted-foreground">
							Zugriff benötigt?{" "}
							<Link href="#" className="text-foreground hover:underline">
								Support kontaktieren
							</Link>
						</p>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
