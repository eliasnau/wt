import { redirect } from "next/navigation";

export default function MembersSettingsRedirectPage() {
	redirect("/dashboard/settings/users");
}
