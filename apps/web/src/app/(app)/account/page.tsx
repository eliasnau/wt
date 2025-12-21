import { protectPage } from "@/lib/auth";
import { ProfileFrame } from "./_components/profile-frame";
import { DeleteAccountFrame } from "./_components/delete-account-frame";
import { EmailVerificationBanner } from "./_components/email-verification-banner";

export default async function AccountPage() {
	const { user } = await protectPage();

	return (
		<div className="space-y-6">
			{!user.emailVerified && <EmailVerificationBanner email={user.email} />}
			<ProfileFrame
				initialName={user?.name || ""}
				initialEmail={user?.email || ""}
			/>
			<DeleteAccountFrame />
		</div>
	);
}
