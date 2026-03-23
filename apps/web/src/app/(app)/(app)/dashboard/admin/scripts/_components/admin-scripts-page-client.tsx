"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldLabel,
	FieldSet,
} from "@/components/ui/field";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../../_components/page-header";

type AdminScriptsPageClientProps = {
	initialOrganizationId: string;
};

export function AdminScriptsPageClient({
	initialOrganizationId,
}: AdminScriptsPageClientProps) {
	const [organizationId, setOrganizationId] = useState(initialOrganizationId);
	const [resultText, setResultText] = useState("");

	const reGeocodeMutation = useMutation(
		orpc.members.reGeocodeOrganization.mutationOptions({
			onSuccess: (result) => {
				setResultText(JSON.stringify(result, null, 2));
				toast.success("Adress-Geocoding abgeschlossen", {
					description: `${result.updatedCount} aktualisiert, ${result.failedCount} fehlgeschlagen.`,
				});
			},
			onError: (error) => {
				setResultText(
					JSON.stringify(
						{
							error: error instanceof Error ? error.message : String(error),
						},
						null,
						2,
					),
				);
				toast.error("Adress-Geocoding fehlgeschlagen", {
					description:
						error instanceof Error ? error.message : "Bitte erneut versuchen.",
				});
			},
		}),
	);

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Admin Scripts</HeaderTitle>
					<HeaderDescription>
						Interne Werkzeuge fuer manuelle Wartung. Diese Seite ist absichtlich
						nicht verlinkt.
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<Frame>
				<FrameHeader>
					<div>
						<p className="font-medium">Mitglieder-Adressen neu geocodieren</p>
						<p className="text-muted-foreground text-sm">
							Laeuft fuer alle Mitglieder der aktiven Organisation mit
							vorhandener Adresse.
						</p>
					</div>
				</FrameHeader>
				<FramePanel className="space-y-6">
					<FieldSet>
						<Field>
							<FieldLabel>Organization ID</FieldLabel>
							<Input
								value={organizationId}
								onChange={(event) => setOrganizationId(event.target.value)}
								placeholder="org_xxx"
							/>
							<FieldDescription>
								Muss der aktuell aktiven Organisation entsprechen.
							</FieldDescription>
						</Field>
					</FieldSet>

					<div className="flex items-center gap-3">
						<Button
							onClick={() =>
								reGeocodeMutation.mutate({
									organizationId: organizationId.trim(),
								})
							}
							disabled={
								reGeocodeMutation.isPending || organizationId.trim() === ""
							}
						>
							{reGeocodeMutation.isPending
								? "Rechne Adressen neu..."
								: "Recalculate addresses"}
						</Button>
					</div>

					<Field>
						<FieldLabel>Result</FieldLabel>
						<Textarea
							value={resultText}
							readOnly
							className="min-h-64 font-mono text-xs"
							placeholder="Result will appear here"
						/>
					</Field>
				</FramePanel>
			</Frame>
		</div>
	);
}
