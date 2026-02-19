"use client";
import { Clock } from "lucide-react";
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
	notes: string | null;
	createdAt: Date;
	memberId: string;
	memberFirstName: string;
	memberLastName: string;
	memberEmail: string;
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
						<p className="text-muted-foreground">
							Keine Zahlungen in diesem Lauf.
						</p>
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
							<TableHead>Mitglied</TableHead>
							<TableHead>E-Mail</TableHead>
							<TableHead className="text-right">Mitgliedschaft</TableHead>
							<TableHead className="text-right">Aufnahmegebühr</TableHead>
							<TableHead className="text-right">Jahresbeitrag</TableHead>
							<TableHead className="text-right">Total</TableHead>
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
								<TableCell>
									<Badge variant="secondary" className="gap-1">
										<Clock className="size-3" />
										Pending
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}
