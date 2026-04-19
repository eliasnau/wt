import { Suspense } from "react";
import { NoPermission } from "@/components/dashboard/no-permission";
import { hasPermission } from "@/lib/auth";
import { InventoryPageClient } from "./inventory-page-client";

export default async function InventoryPage() {
	const result = await hasPermission({ inventory: ["view"] });

	if (!result.success) {
		return (
			<NoPermission
				title="Kein Zugriff auf Inventar"
				description="Du hast nicht die nötigen Berechtigungen, um Inventar zu sehen. Wende dich an einen Organisations-Admin, um Zugriff zu erhalten."
			/>
		);
	}

	return (
		<Suspense>
			<InventoryPageClient />
		</Suspense>
	);
}
