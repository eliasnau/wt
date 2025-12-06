import { TaskChooseOrganization } from "@clerk/nextjs";


export default function OrganizationsPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<TaskChooseOrganization redirectUrlComplete={"/dashboard"} />
		</div>
	);
}
