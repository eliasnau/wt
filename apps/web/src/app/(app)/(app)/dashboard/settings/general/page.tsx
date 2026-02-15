import { CircleUser } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { requireActiveOrg } from "@/lib/auth";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { CustomDomainFrame } from "./_components/custom-domain-frame";
import { OrganizationInfoFrame } from "./_components/organization-info-frame";
import { OrganizationSlugFrame } from "./_components/organization-slug-frame";
import { SettingsFramesSkeleton } from "./_components/settings-skeleton";

async function FramesSection() {
	const { organization } = await requireActiveOrg();

	return (
		<div className="space-y-6">
			<OrganizationInfoFrame
				organizationId={organization.id}
				initialName={organization.name}
			/>

			<OrganizationSlugFrame
				organizationId={organization.id}
				initialSlug={organization.slug}
			/>

			<CustomDomainFrame />
		</div>
	);
}

export default function GeneralSettingsPage() {
	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Allgemeine Einstellungen</HeaderTitle>
					<HeaderDescription>
						Verwalte die allgemeinen Einstellungen deiner Organisation
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Link href={"/account/customization" as Route}>
						<Button variant={"outline"}>
							<CircleUser className="mr-2 size-4" />
							Customization
						</Button>
					</Link>
					<Link href={"/account"}>
						<Button variant={"outline"}>
							<CircleUser className="mr-2 size-4" />
							View Account Settings
						</Button>
					</Link>
				</HeaderActions>
			</Header>

			<Suspense fallback={<SettingsFramesSkeleton />}>
				<FramesSection />
			</Suspense>
		</div>
	);
}
