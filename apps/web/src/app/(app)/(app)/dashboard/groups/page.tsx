import { Suspense } from "react";
import { NoPermission } from "@/components/dashboard/no-permission";
import { hasPermission } from "@/lib/auth";
import { GroupsPageClient } from "./groups-page-client";

export default async function GroupsPage() {
	const result = await hasPermission({ groups: ["view"] });

	if (!result.success) {
		return (
			<NoPermission
				title="Kein Zugriff auf Gruppen"
				description="Du hast nicht die nötigen Berechtigungen, um Gruppen anzusehen. Wende dich an einen Organisations-Admin, um Zugriff zu erhalten."
			/>
		);
	}

	return (
		<Suspense>
			<GroupsPageClient />
		</Suspense>
	);
}
