import { auth } from "@repo/auth/server";
import { ChangePasswordFrame } from "./_components/change-password-frame";
import { TwoFactorFrame } from "./_components/two-factor-frame";
import { PasskeyFrame } from "./_components/passkey-frame";
import { SessionsFrame } from "./_components/sessions-frame";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession, protectPage } from "@/lib/auth";

export default async function SecurityPage() {
	const session = await protectPage();

	const twoFactorEnabled = session.user.twoFactorEnabled ?? false;
	const currentSessionId = session.session.id;

	return (
		<div className="space-y-6">
			<ChangePasswordFrame />
			<PasskeyFrame currentSessionId={currentSessionId} />
			<TwoFactorFrame twoFactorEnabled={twoFactorEnabled} />
			<SessionsFrame currentSessionId={currentSessionId} />
		</div>
	);
}
