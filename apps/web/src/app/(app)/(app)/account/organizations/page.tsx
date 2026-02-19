"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { OrganizationsFrame } from "./_components/organizations-frame";

export const dynamic = "force-dynamic";

export default function OrganizationsPage() {
	const { data: session } = authClient.useSession();

	if (!session) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center py-12">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<div className="flex flex-col gap-6">
				<Header>
					<HeaderContent>
						<HeaderTitle>Organisation</HeaderTitle>
						<HeaderDescription>Verwalte deine Organisation</HeaderDescription>
					</HeaderContent>
					<HeaderActions />
				</Header>
				<OrganizationsFrame />
			</div>
		</Suspense>
	);
}
