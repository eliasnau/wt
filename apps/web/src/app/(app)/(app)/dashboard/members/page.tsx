import { Suspense } from "react";
import { NoPermission } from "@/components/dashboard/no-permission";
import { hasPermission } from "@/lib/auth";
import { MembersPageClient } from "./members-page-client";

export default async function MembersPage() {
	const result = await hasPermission({ member: ["list"] });

	if (!result.success) {
		return (
			<NoPermission
				title="Kein Zugriff auf Mitglieder"
				description="Du hast nicht die nötigen Berechtigungen, um Mitglieder anzusehen. Wende dich an einen Organisations-Admin, um Zugriff zu erhalten."
			/>
		);
	}

	return (
		<Suspense>
			<MembersPageClient />
		</Suspense>
	);
}
