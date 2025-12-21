"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";

export function CustomDomainFrame() {
	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				{/* <h2 className="mb-2 font-heading text-foreground text-xl">
					Custom Domain
				</h2>
				<p className="mb-6 text-muted-foreground text-sm">
					Use your own domain for member access
				</p> */}

				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Globe />
						</EmptyMedia>
						<EmptyTitle>No custom domain configured</EmptyTitle>
						<EmptyDescription>
							You haven't set up a custom domain yet. Add one to use your own
							domain for your organization's member area.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</FramePanel>
			<FrameFooter className="flex-row justify-end gap-2">
				<Button variant="outline" size="sm">
					Add Domain
				</Button>
			</FrameFooter>
		</Frame>
	);
}
