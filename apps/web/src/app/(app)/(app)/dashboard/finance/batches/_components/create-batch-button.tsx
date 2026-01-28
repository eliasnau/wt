"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

export function CreateBatchButton() {
	const [open, setOpen] = useState(false);
	const [billingMonth, setBillingMonth] = useState("");
	const [notes, setNotes] = useState("");
	const queryClient = useQueryClient();

	const createMutation = useMutation(
		orpc.paymentBatches.create.mutationOptions({
			onSuccess: (data) => {
				toast.success("Payment batch created", {
					description: `Batch ${data.batch.batchNumber} created with ${data.payments.length} payments`,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.paymentBatches.list.queryKey({ input: {} }),
				});
				setOpen(false);
				setBillingMonth("");
				setNotes("");
			},
			onError: (error: any) => {
				toast.error("Failed to create batch", {
					description:
						error instanceof Error ? error.message : "Something went wrong",
				});
			},
		})
	);

	const handleSubmit = () => {
		if (!billingMonth) {
			toast.error("Please select a billing month");
			return;
		}

		// Convert YYYY-MM to YYYY-MM-01
		const formattedDate = `${billingMonth}-01`;

		createMutation.mutate({
			billingMonth: formattedDate,
			notes: notes || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button />}>
					<Plus className="mr-2 size-4" />
					Create Batch
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Payment Batch</DialogTitle>
					<DialogDescription>
						Generate a new payment batch for all active members for a specific
						month
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Field>
						<FieldLabel>Billing Month</FieldLabel>
						<Input
							type="month"
							value={billingMonth}
							onChange={(e) => setBillingMonth(e.target.value)}
							required
						/>
						<FieldDescription>
							Select the month to generate payments for
						</FieldDescription>
					</Field>

					<Field>
						<FieldLabel>Notes (Optional)</FieldLabel>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Add any notes about this batch..."
							rows={3}
						/>
					</Field>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={createMutation.isPending || !billingMonth}
					>
						{createMutation.isPending ? "Creating..." : "Create Batch"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
