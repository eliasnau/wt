import { Suspense } from "react";
import { NoPermission } from "@/components/dashboard/no-permission";
import { hasPermission } from "@/lib/auth";
import { MembersV2PageClient } from "./members-v2-page-client";

export default async function MembersV2Page() {
	const [result, exportPermission] = await Promise.all([
		hasPermission({ member: ["view"] }),
		hasPermission({ member: ["export"] }),
	]);

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
			<MembersV2PageClient canExportMembers={exportPermission.success} />
		</Suspense>
	);
}
