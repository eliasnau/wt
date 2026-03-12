import type { SepaSettings } from "@repo/api/lib/sepa";
import { mapSepaRowToSettings } from "@repo/api/lib/sepa";
import { db, eq } from "@repo/db";
import { organizationSettings } from "@repo/db/schema";
import { requireActiveOrg, requirePermission } from "@/lib/auth";
import {
	Header,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { SepaSettingsForm } from "./_components/sepa-settings-form";

function toInitialFormState(settings: SepaSettings | null) {
	return {
		creditorName: settings?.creditorName ?? "",
		creditorIban: settings?.creditorIban ?? "",
		creditorBic: settings?.creditorBic ?? "",
		creditorId: settings?.creditorId ?? "",
		initiatorName: settings?.initiatorName ?? "",
		batchBooking: settings?.batchBooking ?? true,
		membershipTemplate: settings?.remittanceTemplates?.membership ?? "",
		joiningFeeTemplate: settings?.remittanceTemplates?.joiningFee ?? "",
		yearlyFeeTemplate: settings?.remittanceTemplates?.yearlyFee ?? "",
	};
}

async function loadSepaSettings() {
	const { organization } = await requireActiveOrg();
	await requirePermission({ sepa: ["view"] });

	const [settingsRow] = await db
		.select()
		.from(organizationSettings)
		.where(eq(organizationSettings.organizationId, organization.id))
		.limit(1);

	return settingsRow ? mapSepaRowToSettings(settingsRow) : null;
}

export default async function SepaSettingsPage() {
	const settings = await loadSepaSettings();

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>SEPA-Zahlungseinstellungen</HeaderTitle>
					<HeaderDescription>
						Configure your SEPA direct debit payment information
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<SepaSettingsForm initialFormState={toInitialFormState(settings)} />
		</div>
	);
}
