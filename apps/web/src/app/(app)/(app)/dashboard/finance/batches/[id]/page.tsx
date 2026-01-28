"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { BatchInfoCard } from "./_components/batch-info-card";
import { PaymentsTable } from "./_components/payments-table";

export default function BatchDetailsPage({
	params,
}: {
	params: { id: string };
}) {
	const { data, isPending, error, refetch } = useQuery(
		orpc.paymentBatches.view.queryOptions({
			input: { id: params.id },
		}),
	);

	if (isPending) {
		return (
			<div className="flex flex-col gap-8">
				<div className="flex items-center gap-4">
					<Link href="/dashboard/finance/batches">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="size-4" />
						</Button>
					</Link>
					<Skeleton className="h-10 w-64" />
				</div>
				<Frame>
					<FramePanel>
						<div className="space-y-4">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-64 w-full" />
						</div>
					</FramePanel>
				</Frame>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col gap-8">
				<div className="flex items-center gap-4">
					<Link href="/dashboard/finance/batches">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="size-4" />
						</Button>
					</Link>
					<h1 className="font-bold text-2xl">Payment Batch</h1>
				</div>
				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Failed to load batch</EmptyTitle>
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
			</div>
		);
	}

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "long",
		}).format(date);
	};

	return (
		<div className="flex flex-col gap-8">
			<div className="flex items-center gap-4">
				<Link href="/dashboard/finance/batches">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="size-4" />
					</Button>
				</Link>
				<div>
					<h1 className="font-bold text-2xl">
						{formatDate(data.batch.billingMonth)}
					</h1>
					<p className="text-muted-foreground text-sm">
						{data.batch.batchNumber}
					</p>
				</div>
			</div>

			<BatchInfoCard batch={(data.batch as any)} />

			<div>
				<h2 className="mb-4 font-semibold text-xl">Payments</h2>
				<PaymentsTable payments={data.payments} />
			</div>
		</div>
	);
}
