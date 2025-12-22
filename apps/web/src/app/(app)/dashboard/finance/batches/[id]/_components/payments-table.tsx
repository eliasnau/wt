"use client";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type Payment = {
	id: string;
	contractId: string;
	membershipAmount: string;
	joiningFeeAmount: string;
	yearlyFeeAmount: string;
	totalAmount: string;
	billingPeriodStart: string;
	billingPeriodEnd: string;
	dueDate: string;
	paidAt: Date | null;
	bankTransactionId: string | null;
	mandateReference: string | null;
	notes: string | null;
	createdAt: Date;
	memberId: string;
	memberFirstName: string;
	memberLastName: string;
	memberEmail: string;
	memberIban: string;
	memberBic: string | null;
	memberCardHolder: string;
};

export function PaymentsTable({ payments }: { payments: Payment[] }) {
	const formatCurrency = (amount: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EUR",
		}).format(Number.parseFloat(amount));
	};

	if (payments.length === 0) {
		return (
			<Frame>
				<FramePanel>
					<div className="py-12 text-center">
						<p className="text-muted-foreground">No payments in this batch.</p>
					</div>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<Frame>
			<FramePanel>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Member</TableHead>
							<TableHead>Email</TableHead>
							<TableHead className="text-right">Membership</TableHead>
							<TableHead className="text-right">Joining Fee</TableHead>
							<TableHead className="text-right">Yearly Fee</TableHead>
							<TableHead className="text-right">Total</TableHead>
							<TableHead>IBAN</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{payments.map((payment) => (
							<TableRow key={payment.id}>
								<TableCell className="font-medium">
									{payment.memberFirstName} {payment.memberLastName}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{payment.memberEmail}
								</TableCell>
								<TableCell className="text-right">
									{formatCurrency(payment.membershipAmount)}
								</TableCell>
								<TableCell className="text-right">
									{Number.parseFloat(payment.joiningFeeAmount) > 0 ? (
										formatCurrency(payment.joiningFeeAmount)
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell className="text-right">
									{Number.parseFloat(payment.yearlyFeeAmount) > 0 ? (
										formatCurrency(payment.yearlyFeeAmount)
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell className="text-right font-semibold">
									{formatCurrency(payment.totalAmount)}
								</TableCell>
								<TableCell className="font-mono text-sm">
									{payment.memberIban}
								</TableCell>
								<TableCell>
									{payment.paidAt ? (
										<Badge variant="default" className="gap-1">
											<CheckCircle2 className="size-3" />
											Paid
										</Badge>
									) : (
										<Badge variant="secondary" className="gap-1">
											<Clock className="size-3" />
											Pending
										</Badge>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}
