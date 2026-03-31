"use client";

import { useState } from "react";
import {
	Header,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { CreditGrantDetailSheet } from "./_components/credit-grant-detail-sheet";
import { CreditGrantsTable } from "./_components/credit-grants-table";

export default function CreditGrantsPage() {
	const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleSelectGrant = (grantId: string) => {
		setSelectedGrantId(grantId);
		setSheetOpen(true);
	};

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Guthaben</HeaderTitle>
					<HeaderDescription>
						Übersicht aller vergebenen Guthaben und freien Monate. Guthaben
						werden automatisch bei der Rechnungserstellung angerechnet.
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<CreditGrantsTable onSelectGrant={handleSelectGrant} />

			<CreditGrantDetailSheet
				grantId={selectedGrantId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}
