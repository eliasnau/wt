"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { OrganizationsFrame } from "./_components/organizations-frame";
import { Suspense } from "react";

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
			<div className="space-y-6">
				<OrganizationsFrame />
			</div>
		</Suspense>
	);
}
