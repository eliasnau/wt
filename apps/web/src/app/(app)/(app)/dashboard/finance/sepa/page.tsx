"use client";

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
import PaymentBatchesTable from "../batches/_components/payment-batches-table";

export default function SepaExportPage() {
	const { data, isPending, error, refetch } = useQuery(
		orpc.paymentBatches.list.queryOptions({
			input: {},
		}),
	);
	const [exportingBatchId, setExportingBatchId] = useState<string | null>(
		null,
	);

	const handleExport = useCallback(async (batchId: string) => {
		setExportingBatchId(batchId);
		try {
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
			toast.success("SEPA file ready", {
				description: `Downloaded ${result.fileName}`,
			});
		} catch (err) {
			toast.error("Failed to export SEPA file", {
				description: err instanceof Error ? err.message : "Please try again.",
			});
		} finally {
			setExportingBatchId(null);
		}
	}, []);

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>SEPA Exports</HeaderTitle>
					<HeaderDescription>
						Download SEPA XML files for your payment batches
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Button variant="outline" onClick={() => refetch()}>
						Refresh
					</Button>
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
								<EmptyTitle>Failed to load payment batches</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Something went wrong. Please try again."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => refetch()}>Try Again</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			) : (
				<PaymentBatchesTable
					data={data ?? []}
					loading={isPending}
					onExportSepa={handleExport}
					exportingBatchId={exportingBatchId}
				/>
			)}
		</div>
	);
}
