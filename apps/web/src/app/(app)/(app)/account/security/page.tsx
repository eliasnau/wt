import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession, protectPage } from "@/lib/auth";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { ChangePasswordFrame } from "./_components/change-password-frame";
import { PasskeyEnableBanner } from "./_components/passkey-enable-banner";
import { PasskeyFrame } from "./_components/passkey-frame";
import { SessionsFrame } from "./_components/sessions-frame";
import { TwoFactorEnableBanner } from "./_components/two-factor-enable-banner";
import { TwoFactorFrame } from "./_components/two-factor-frame";

export default async function SecurityPage() {
	const session = await protectPage();
	const passkeys = await auth.api.listPasskeys({ headers: await headers() });

	const twoFactorEnabled = session.user.twoFactorEnabled ?? false;
	const currentSessionId = session.session.id;

	return (
		<div className="flex flex-col gap-6">
			<Header>
				<HeaderContent>
					<HeaderTitle>Sicherheit</HeaderTitle>
					<HeaderDescription>
						Verwalte deine Anmeldemethoden und Sitzungen
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions></HeaderActions>
			</Header>

			{!twoFactorEnabled && <TwoFactorEnableBanner />}
			{passkeys.length === 0 && <PasskeyEnableBanner />}
			<ChangePasswordFrame />
			<PasskeyFrame
				currentSessionId={currentSessionId}
				initalPasskeys={passkeys}
			/>
			<TwoFactorFrame twoFactorEnabled={twoFactorEnabled} />
			<SessionsFrame currentSessionId={currentSessionId} />
		</div>
	);
}
