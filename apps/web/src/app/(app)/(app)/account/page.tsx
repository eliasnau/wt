import { protectPageFresh } from "@/lib/auth";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../_components/page-header";
import { DeleteAccountFrame } from "./_components/delete-account-frame";
import { EmailVerificationBanner } from "./_components/email-verification-banner";
import { ProfileFrame } from "./_components/profile-frame";

export default async function AccountPage() {
	const { user } = await protectPageFresh();

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Profil</HeaderTitle>
					<HeaderDescription>
						Verwalte deine Profilinformationen
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions />
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
