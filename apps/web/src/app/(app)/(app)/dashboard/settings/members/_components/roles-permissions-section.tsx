"use client";

import { ChevronDownIcon, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import {
	Empty,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";

export function RolesPermissionsSection() {
	return (
		<Frame className="w-full">
			<Collapsible defaultOpen={false}>
				<FrameHeader className="flex-row items-center justify-between px-2 py-2">
					<CollapsibleTrigger
						className="data-panel-open:[&_svg]:rotate-180"
						render={<Button variant="ghost" />}
					>
						<ChevronDownIcon className="size-4" />
						Roles & Permissions
					</CollapsibleTrigger>
				</FrameHeader>
				<CollapsiblePanel>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Settings2 />
								</EmptyMedia>
								<EmptyTitle>Custom Roles</EmptyTitle>
								<EmptyDescription>
									Manage custom roles and permissions for your organization.
									Coming soon...
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</FramePanel>
				</CollapsiblePanel>
			</Collapsible>
		</Frame>
	);
}
