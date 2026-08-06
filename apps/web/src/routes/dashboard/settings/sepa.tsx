import { Button } from "@matdesk/ui/components/button";
import {
	Card,
	CardFrame,
	CardFrameDescription,
	CardFrameFooter,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@matdesk/ui/components/card";
import { Checkbox } from "@matdesk/ui/components/checkbox";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Input } from "@matdesk/ui/components/input";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/settings/sepa")({
	component: RouteComponent,
});

function RouteComponent() {
	const settingsQuery = useQuery(orpc.billing.getSepaSettings.queryOptions({ input: {} }));

	const [creditorName, setCreditorName] = useState("");
	const [creditorIban, setCreditorIban] = useState("");
	const [creditorBic, setCreditorBic] = useState("");
	const [creditorId, setCreditorId] = useState("");
	const [initiatorName, setInitiatorName] = useState("");
	const [batchBooking, setBatchBooking] = useState(true);
	const [remittanceMembership, setRemittanceMembership] = useState("");
	const [remittanceJoiningFee, setRemittanceJoiningFee] = useState("");
	const [remittanceYearlyFee, setRemittanceYearlyFee] = useState("");

	useEffect(() => {
		const s = settingsQuery.data;
		if (!s) return;
		setCreditorName(s.creditorName ?? "");
		setCreditorIban(s.creditorIban ?? "");
		setCreditorBic(s.creditorBic ?? "");
		setCreditorId(s.creditorId ?? "");
		setInitiatorName(s.initiatorName ?? "");
		setBatchBooking(s.batchBooking ?? true);
		setRemittanceMembership(s.remittanceMembership ?? "");
		setRemittanceJoiningFee(s.remittanceJoiningFee ?? "");
		setRemittanceYearlyFee(s.remittanceYearlyFee ?? "");
	}, [settingsQuery.data]);

	const mutation = useMutation(
		orpc.billing.updateSepaSettings.mutationOptions({
			onSuccess: () => {
				toast.success("SEPA-Einstellungen gespeichert");
				queryClient.invalidateQueries({ queryKey: orpc.billing.getSepaSettings.key() });
			},
			onError: (error) => toast.error(parseError(error).message),
		}),
	);

	function submit() {
		mutation.mutate({
			creditorName: creditorName.trim() || undefined,
			creditorIban: creditorIban.trim() || undefined,
			creditorBic: creditorBic.trim() || undefined,
			creditorId: creditorId.trim() || undefined,
			initiatorName: initiatorName.trim() || undefined,
			batchBooking,
			remittanceMembership: remittanceMembership.trim() || undefined,
			remittanceJoiningFee: remittanceJoiningFee.trim() || undefined,
			remittanceYearlyFee: remittanceYearlyFee.trim() || undefined,
		});
	}

	const header = (
		<div>
			<h1 className="font-semibold text-2xl tracking-tight">SEPA</h1>
			<p className="mt-1 text-muted-foreground text-sm">
				Konfiguration für den SEPA-Lastschrifteinzug.
			</p>
		</div>
	);

	if (settingsQuery.isPending) {
		return (
			<div className="flex flex-col gap-6">
				{header}
				<Skeleton className="h-96 w-full rounded-2xl" />
			</div>
		);
	}

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			{header}
			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Gläubiger</CardFrameTitle>
					<CardFrameDescription>
						Bankdaten deines Vereins für den SEPA-Lastschrifteinzug.
					</CardFrameDescription>
				</CardFrameHeader>
				<Card>
					<CardPanel className="flex flex-col gap-4">
						<Field>
							<FieldLabel>Gläubigername</FieldLabel>
							<Input
								onChange={(e) => setCreditorName(e.target.value)}
								placeholder="Beispiel e. V."
								value={creditorName}
							/>
						</Field>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel>IBAN</FieldLabel>
								<Input
									className="font-mono"
									onChange={(e) => setCreditorIban(e.target.value)}
									placeholder="DE89 3704 0044 0532 0130 00"
									value={creditorIban}
								/>
							</Field>
							<Field>
								<FieldLabel>BIC</FieldLabel>
								<Input
									className="font-mono"
									onChange={(e) => setCreditorBic(e.target.value)}
									placeholder="COBADEFFXXX"
									value={creditorBic}
								/>
							</Field>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel>Gläubiger-ID</FieldLabel>
								<Input
									className="font-mono"
									onChange={(e) => setCreditorId(e.target.value)}
									placeholder="DE98ZZZ09999999999"
									value={creditorId}
								/>
							</Field>
							<Field>
								<FieldLabel>Initiator-Name</FieldLabel>
								<Input
									onChange={(e) => setInitiatorName(e.target.value)}
									placeholder="Optional"
									value={initiatorName}
								/>
							</Field>
						</div>
						<label className="flex items-center gap-2.5">
							<Checkbox checked={batchBooking} onCheckedChange={(v) => setBatchBooking(v === true)} />
							<span className="text-sm">Sammelbuchung (Batch Booking)</span>
						</label>
					</CardPanel>
				</Card>
			</CardFrame>

			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Verwendungszwecke</CardFrameTitle>
					<CardFrameDescription>
						Texte auf den Kontoauszügen deiner Mitglieder.
					</CardFrameDescription>
				</CardFrameHeader>
				<Card>
					<CardPanel className="flex flex-col gap-4">
						<Field>
							<FieldLabel>Mitgliedsbeitrag</FieldLabel>
							<Input
								onChange={(e) => setRemittanceMembership(e.target.value)}
								placeholder="Mitgliedsbeitrag {Zeitraum}"
								value={remittanceMembership}
							/>
						</Field>
						<Field>
							<FieldLabel>Aufnahmegebühr</FieldLabel>
							<Input
								onChange={(e) => setRemittanceJoiningFee(e.target.value)}
								placeholder="Aufnahmegebühr"
								value={remittanceJoiningFee}
							/>
						</Field>
						<Field>
							<FieldLabel>Jahresbeitrag</FieldLabel>
							<Input
								onChange={(e) => setRemittanceYearlyFee(e.target.value)}
								placeholder="Jahresbeitrag {Jahr}"
								value={remittanceYearlyFee}
							/>
							<FieldDescription>Platzhalter werden beim Einzug ersetzt.</FieldDescription>
						</Field>
					</CardPanel>
				</Card>
				<CardFrameFooter className="flex justify-end">
					<Button loading={mutation.isPending} type="submit">
						Speichern
					</Button>
				</CardFrameFooter>
			</CardFrame>
		</form>
	);
}
