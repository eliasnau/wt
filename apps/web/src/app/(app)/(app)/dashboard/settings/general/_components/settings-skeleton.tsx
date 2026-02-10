import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationInfoSkeleton() {
	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				<h2 className="mb-2 font-heading text-foreground text-xl">
					Organization Information
				</h2>
				<p className="mb-6 text-muted-foreground text-sm">
					Update your organization details and public information
				</p>
				<div className="space-y-4">
					<Field>
						<FieldLabel>Organisationsname</FieldLabel>
						<Skeleton className="h-8 w-full rounded-lg" />
					</Field>
				</div>
			</FramePanel>
			<FrameFooter className="flex-row justify-end gap-2">
				<Button type="button" variant="ghost" disabled>
					Reset
				</Button>
				<Button type="button" disabled>
					Save Changes
				</Button>
			</FrameFooter>
		</Frame>
	);
}

export function OrganizationSlugSkeleton() {
	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				<h2 className="mb-2 font-heading text-foreground text-xl">
					Organization Slug
				</h2>
				<p className="mb-6 text-muted-foreground text-sm">
					Your default member area URL
				</p>

				<Field>
					<FieldLabel>Member Area URL</FieldLabel>
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-full rounded-lg" />
						<Skeleton className="size-8 shrink-0 rounded-lg" />
					</div>
				</Field>
			</FramePanel>
			<FrameFooter className="flex-row justify-end gap-2">
				<Button type="button" variant="outline" size="sm" disabled>
					Change Slug
				</Button>
			</FrameFooter>
		</Frame>
	);
}

export function CustomDomainSkeleton() {
	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				<h2 className="mb-2 font-heading text-foreground text-xl">
					Custom Domain
				</h2>
				<p className="mb-6 text-muted-foreground text-sm">
					Use your own domain for member access
				</p>

				<div className="flex flex-col items-center justify-center py-8">
					<Skeleton className="mb-4 size-12 rounded-full" />
					<Skeleton className="mb-2 h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</FramePanel>
			<FrameFooter className="flex-row justify-end gap-2">
				<Button variant="outline" size="sm" disabled>
					Add Domain
				</Button>
			</FrameFooter>
		</Frame>
	);
}

export function SettingsFramesSkeleton() {
	return (
		<div className="space-y-6">
			<OrganizationInfoSkeleton />
			<OrganizationSlugSkeleton />
			<CustomDomainSkeleton />
		</div>
	);
}
