"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
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
import { orpc } from "@/utils/orpc";
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

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Payment Batches</HeaderTitle>
					<HeaderDescription>
						Generate and manage monthly payment batches for members
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
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
								<EmptyTitle>Failed to load Payment Batches</EmptyTitle>
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
				<PaymentBatchesTable data={data ?? []} loading={isPending} />
			)}
		</div>
	);
}
