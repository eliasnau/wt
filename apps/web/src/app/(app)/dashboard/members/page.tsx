import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MembersTable } from "./_components/members-table";

export default function MembersPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<PageHeader
					title="Members"
					description="Manage your organization members and their roles"
				/>
				<Button>
					<Plus className="size-4 mr-2" />
					Create Member
				</Button>
			</div>

			<MembersTable />
		</div>
	);
}
