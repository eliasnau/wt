import { Button } from "@/components/ui/button";
import {
	Card,
	CardFrame,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationInfoSkeleton() {
	return (
		<CardFrame>
			<CardFrameHeader>
				<CardFrameTitle>Organization Information</CardFrameTitle>
				<CardFrameDescription>
					Aktualisiere die Details deiner Organisation und öffentliche
					Informationen
				</CardFrameDescription>
			</CardFrameHeader>
			<Card>
				<CardPanel>
					<div className="space-y-4">
						<Field>
							<FieldLabel>Organisationsname</FieldLabel>
							<Skeleton className="h-8 w-full rounded-lg" />
						</Field>
					</div>
					<div className="mt-4 flex justify-end gap-2">
						<Button type="button" variant="ghost" disabled>
							Reset
						</Button>
						<Button type="button" disabled>
							Änderungen speichern
						</Button>
					</div>
				</CardPanel>
			</Card>
		</CardFrame>
	);
}

export function OrganizationSlugSkeleton() {
	return (
		<CardFrame>
			<CardFrameHeader>
				<CardFrameTitle>Organization Slug</CardFrameTitle>
				<CardFrameDescription>
					Your default member area URL
				</CardFrameDescription>
			</CardFrameHeader>
			<Card>
				<CardPanel>
					<Field>
						<FieldLabel>Mitgliederbereich-URL</FieldLabel>
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-full rounded-lg" />
							<Skeleton className="size-8 shrink-0 rounded-lg" />
						</div>
					</Field>
					<div className="mt-4 flex justify-end gap-2">
						<Button type="button" variant="outline" size="sm" disabled>
							Change Slug
						</Button>
					</div>
				</CardPanel>
			</Card>
		</CardFrame>
	);
}

export function CustomDomainSkeleton() {
	return (
		<CardFrame>
			<CardFrameHeader>
				<CardFrameTitle>Custom Domain</CardFrameTitle>
				<CardFrameDescription>
					Use your own domain for member access
				</CardFrameDescription>
			</CardFrameHeader>
			<Card>
				<CardPanel>
					<div className="flex flex-col items-center justify-center py-8">
						<Skeleton className="mb-4 size-12 rounded-full" />
						<Skeleton className="mb-2 h-6 w-48" />
						<Skeleton className="h-4 w-64" />
					</div>
					<div className="mt-4 flex justify-end gap-2">
						<Button variant="outline" size="sm" disabled>
							Add Domain
						</Button>
					</div>
				</CardPanel>
			</Card>
		</CardFrame>
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
