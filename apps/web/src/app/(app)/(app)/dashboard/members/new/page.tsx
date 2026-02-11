"use client";

import {
	Header,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { NewMemberForm } from "./_components/new-member-form";

export const dynamic = "force-dynamic";

export default function NewMemberPage() {
	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Neues Mitglied erstellen</HeaderTitle>
					<HeaderDescription>
						Füge deiner Organisation ein neues Mitglied hinzu
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<NewMemberForm />
		</div>
	);
}
