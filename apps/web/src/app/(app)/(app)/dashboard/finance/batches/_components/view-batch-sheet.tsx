"use client";
import { useQuery } from "@tanstack/react-query";
import {
	Calendar,
	Check,
	ChevronRight,
	Copy,
	CreditCard,
	Download,
	Receipt,
	UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface ViewBatchSheetProps {
	batchId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const formatDate = (dateStr: string) =>
	new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
	}).format(new Date(dateStr));

const formatCurrency = (amount: string | null) => {
	if (!amount) return "€0.00";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "EUR",
	}).format(Number.parseFloat(amount));
};

function CopyButton({
	value,
	className,
}: {
	value: string;
	className?: string;
}) {
	const { copyToClipboard, isCopied } = useCopyToClipboard({
		timeout: 2000,
	});

	const handleCopy = async () => {
		await copyToClipboard(value);
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn(
				"h-6 w-6 text-muted-foreground hover:text-foreground",
				className,
			)}
			onClick={handleCopy}
		>
			{isCopied ? (
				<Check className="h-3 w-3" />
			) : (
				<Copy className="h-3 w-3" />
			)}
			<span className="sr-only">Copy</span>
		</Button>
	);
}

export function ViewBatchSheet({
	batchId,
	open,
	onOpenChange,
}: ViewBatchSheetProps) {
	const { data, isPending } = useQuery({
		...orpc.paymentBatches.view.queryOptions({
			input: { id: batchId || "" },
		}),
		enabled: !!batchId && open,
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetPopup side="right" inset>
				{isPending || !data ? (
					<>
						<SheetHeader>
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-32" />
						</SheetHeader>
						<SheetPanel>
							<div className="space-y-6 pt-6">
								<Skeleton className="h-32 w-full" />
								<Skeleton className="h-48 w-full" />
							</div>
						</SheetPanel>
					</>
				) : (
					<>
						<SheetHeader>
							<SheetTitle>{formatDate(data.batch.billingMonth)}</SheetTitle>
							<SheetDescription>
								Overview of collection details
							</SheetDescription>
						</SheetHeader>

						<SheetPanel>
							<div className="flex flex-col gap-8 py-8">
								{/* Total */}
								<div className="flex flex-col items-center justify-center text-center">
									<span className="font-medium text-muted-foreground text-sm">
										Total Collected
									</span>
									<div className="mt-2 font-bold text-5xl text-foreground tabular-nums tracking-tight">
										{formatCurrency(data.batch.totalAmount)}
									</div>
								</div>

								{/* Breakdown Card */}
								<div className="rounded-lg border shadow-sm">
									<div className="flex items-center justify-between p-4">
										<div className="flex items-center gap-3">
											<div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50 text-foreground">
												<CreditCard className="h-4 w-4" />
											</div>
											<div className="flex flex-col">
												<span className="font-medium text-sm">
													Membership Fees
												</span>
											</div>
										</div>
										<span className="font-semibold tabular-nums">
											{formatCurrency(data.batch.membershipTotal)}
										</span>
									</div>

									<Separator />

									<div className="flex items-center justify-between p-4">
										<div className="flex items-center gap-3">
											<div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50 text-foreground">
												<UserPlus className="h-4 w-4" />
											</div>
											<div className="flex flex-col">
												<span className="font-medium text-sm">
													Joining Fees
												</span>
											</div>
										</div>
										<span className="font-semibold tabular-nums">
											{formatCurrency(data.batch.joiningFeeTotal)}
										</span>
									</div>

									<Separator />

									<div className="flex items-center justify-between p-4">
										<div className="flex items-center gap-3">
											<div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50 text-foreground">
												<Calendar className="h-4 w-4" />
											</div>
											<div className="flex flex-col">
												<span className="font-medium text-sm">Yearly Fees</span>
											</div>
										</div>
										<span className="font-semibold tabular-nums">
											{formatCurrency(data.batch.yearlyFeeTotal)}
										</span>
									</div>
								</div>

								{/* Transactions Link */}
								<div className="rounded-lg border bg-card p-1 shadow-sm">
									<Button
										variant="ghost"
										className="flex h-auto w-full items-center justify-between p-3 hover:bg-muted/50"
									>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
												<Receipt className="h-4 w-4 text-foreground" />
											</div>
											<div className="flex flex-col items-start">
												<span className="font-medium text-sm">
													Processed Payments
												</span>
												<span className="text-muted-foreground text-xs">
													{data.batch.transactionCount} transactions
												</span>
											</div>
										</div>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</Button>
								</div>

								{/* Metadata List */}
								<div className="rounded-lg border bg-muted/10">
									<div className="flex items-center justify-between px-4 py-3">
										<span className="font-medium text-muted-foreground text-sm">
											Batch Number
										</span>
										<div className="flex items-center gap-2">
											<span className="font-mono text-sm">
												#{data.batch.batchNumber}
											</span>
											<CopyButton value={String(data.batch.batchNumber)} />
										</div>
									</div>
									<Separator className="bg-border/50" />
									<div className="flex items-center justify-between px-4 py-3">
										<span className="font-medium text-muted-foreground text-sm">
											Batch ID
										</span>
										<div className="flex items-center gap-2">
											<span className="w-32 truncate text-right font-mono text-muted-foreground text-xs">
												{data.batch.id}
											</span>
											<CopyButton value={data.batch.id} />
										</div>
									</div>
								</div>
							</div>
						</SheetPanel>

						<SheetFooter>
							<Button disabled className="w-full">
								<Download className="mr-2 h-4 w-4" />
								Export SEPA XML
							</Button>
						</SheetFooter>
					</>
				)}
			</SheetPopup>
		</Sheet>
	);
}
