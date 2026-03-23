import { requireActiveOrg, requirePermission } from "@/lib/auth";
import { AdminScriptsPageClient } from "./_components/admin-scripts-page-client";

export default async function AdminScriptsPage() {
	await requirePermission({ member: ["update"] });
	const { session } = await requireActiveOrg();

	return (
		<AdminScriptsPageClient
			initialOrganizationId={session.session.activeOrganizationId}
		/>
	);
}
