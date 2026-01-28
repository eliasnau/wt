import { protectPage } from "@/lib/auth";
import { ProfileFrame } from "./_components/profile-frame";
import { DeleteAccountFrame } from "./_components/delete-account-frame";
import { EmailVerificationBanner } from "./_components/email-verification-banner";
import { Header, HeaderActions, HeaderContent, HeaderDescription, HeaderTitle, } from "../_components/page-header";

export default async function AccountPage() {
	const { user } = await protectPage();

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Profile</HeaderTitle>
					<HeaderDescription>
						Manage your Profile Information
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
				</HeaderActions>
			</Header>
			
			{!user.emailVerified && <EmailVerificationBanner email={user.email} />}
			<ProfileFrame
				initialName={user?.name || ""}
				initialEmail={user?.email || ""}
			/>
			<DeleteAccountFrame />
		</div>
	);
}
