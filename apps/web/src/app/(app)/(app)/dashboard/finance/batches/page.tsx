"use client";
import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { client, orpc } from "@/utils/orpc";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { CreateBatchButton } from "./_components/create-batch-button";
import PaymentBatchesTable from "./_components/payment-batches-table";

export default function PaymentBatchesPage() {
	const { data, isPending, error, refetch } = useQuery(
		orpc.paymentBatches.list.queryOptions({
			input: {},
		}),
	);
	const [exportingBatchId, setExportingBatchId] = useState<string | null>(null);
	const [validatingBatchId, setValidatingBatchId] = useState<string | null>(null);

	const handleValidate = useCallback(async (batchId: string) => {
		setValidatingBatchId(batchId);
		try {
			const result = await client.paymentBatches.validateSepaExport({
				id: batchId,
			});
			if (result.valid) {
				toast.success("SEPA Daten sind gültig", {
					description: `${result.totalPayments} Zahlungen geprüft.`,
				});
				setValidatingBatchId(null);
				return true;
			}

			const example = result.invalidMembers
				.slice(0, 3)
				.map((item) => `${item.memberName}: ${item.reasons.join(", ")}`)
				.join(" | ");
			toast.error("SEPA Export blockiert", {
				description: `${result.invalidCount} ungültige Datensätze. ${example}`,
			});
			setValidatingBatchId(null);
			return false;
		} catch (err) {
			toast.error("SEPA-Pruefung fehlgeschlagen", {
				description: err instanceof Error ? err.message : "Please try again.",
			});
			setValidatingBatchId(null);
			return false;
		}
	}, []);

	const handleExport = useCallback(
		async (batchId: string) => {
			setExportingBatchId(batchId);
			try {
				const isValid = await handleValidate(batchId);
				if (!isValid) return;

				const result = await client.paymentBatches.exportSepa({ id: batchId });
				const blob = new Blob([result.xml], { type: "application/xml" });
				const url = URL.createObjectURL(blob);
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.download = result.fileName;
				document.body.appendChild(anchor);
				anchor.click();
				anchor.remove();
				URL.revokeObjectURL(url);
				toast.success("SEPA-Datei bereit", {
					description: `${result.fileName} wurde heruntergeladen.`,
				});
			} catch (err) {
				const errorMessage =
					err instanceof ORPCError
						? err.message
						: err instanceof Error
							? err.message
							: "Please try again.";
				toast.error("SEPA-Datei konnte nicht exportiert werden", {
					description: errorMessage,
				});
				setExportingBatchId(null);
				return;
			}
			setExportingBatchId(null);
		},
		[handleValidate],
	);

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Zahlungsläufe</HeaderTitle>
					<HeaderDescription>
						Verwalte Zahlungsläufe und exportiere SEPA-Dateien an einem Ort
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Button variant="outline" onClick={() => refetch()}>
						Aktualisieren
					</Button>
					<CreateBatchButton />
				</HeaderActions>
			</Header>

			{error ? (
				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>
									Zahlungsläufe konnten nicht geladen werden
								</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => refetch()}>Erneut versuchen</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
				<PaymentBatchesTable
					data={data ?? []}
					loading={isPending}
					onExportSepa={handleExport}
					onValidateSepa={handleValidate}
					exportingBatchId={exportingBatchId}
					validatingBatchId={validatingBatchId}
				/>
			)}
		</div>
	);
}
