"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Batch = {
	id: string;
	billingMonth: string;
	batchNumber: string | null;
	totalAmount: string;
	membershipTotal: string;
	joiningFeeTotal: string;
	yearlyFeeTotal: string;
	transactionCount: number;
	notes: string | null;
	createdAt: Date;
};

export function BatchInfoCard({ batch }: { batch: Batch }) {
	const formatCurrency = (amount: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EUR",
		}).format(Number.parseFloat(amount));
	};

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Total Amount
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatCurrency(batch.totalAmount)}
					</div>
					<p className="mt-1 text-muted-foreground text-xs">
						{batch.transactionCount} transactions
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Membership Fees
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatCurrency(batch.membershipTotal)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Joining Fees
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatCurrency(batch.joiningFeeTotal)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Yearly Fees
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatCurrency(batch.yearlyFeeTotal)}
					</div>
				</CardContent>
			</Card>

			{batch.notes && (
				<Card className="md:col-span-2 lg:col-span-4">
					<CardHeader className="pb-3">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Notes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{batch.notes}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
