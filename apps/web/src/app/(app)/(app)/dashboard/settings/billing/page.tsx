import {
	Header,
	HeaderContent,
	HeaderTitle,
} from "../../_components/page-header";
import { BillingOverview } from "./_components/billing-overview";

export default function BillingSettingsPage() {
	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Abrechnung</HeaderTitle>
				</HeaderContent>
			</Header>

			<BillingOverview />
		</div>
	);
}
