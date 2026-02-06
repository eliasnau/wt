"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowLeft,
	ChevronDownIcon,
	Copy,
	CreditCard,
	FileText,
	ScrollText,
	Shield,
	User,
	UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { orpc } from "@/utils/orpc";
import { AssignGroupDialog } from "./_components/assign-group-dialog";
import { MemberGroupsTable } from "./_components/member-groups-table";

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return "N/A";
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatCurrency(amount: string | null | undefined) {
	if (!amount) return "€0.00";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "EUR",
	}).format(Number.parseFloat(amount));
}

function parseInitialPeriod(
	value: string | null | undefined,
): "monthly" | "half_yearly" | "yearly" {
	if (value === "monthly" || value === "half_yearly" || value === "yearly") {
		return value;
	}
	return "monthly";
}

function CopyButton({ value }: { value: string }) {
	const { copyToClipboard, isCopied } = useCopyToClipboard({
		onCopy: () => toast.success("Copied to clipboard"),
		timeout: 1000,
	});

	const handleCopy = async () => {
		await copyToClipboard(value);
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
			title="Copy to clipboard"
		>
			<Copy className="size-3.5" />
			{isCopied && <span className="text-xs">Copied!</span>}
		</button>
	);
}

export default function MemberDetailPage() {
	const params = useParams();
	const memberId = params.id as string;
	const [isEditing, setIsEditing] = useState(false);
	const [formState, setFormState] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		guardianName: "",
		guardianEmail: "",
		guardianPhone: "",
		street: "",
		city: "",
		state: "",
		postalCode: "",
		country: "",
		memberNotes: "",
		contractNotes: "",
		contractStartDate: "",
		initialPeriod: "monthly" as "monthly" | "half_yearly" | "yearly",
		joiningFeeAmount: "",
		yearlyFeeAmount: "",
	});

	const {
		data: member,
		isPending,
		error,
		refetch,
	} = useQuery(
		orpc.members.get.queryOptions({
			input: { memberId },
		}),
	);

	const paymentDetailsQuery = useQuery(
		orpc.members.getPaymentDetails.queryOptions({
			input: { memberId },
			enabled: false,
		}),
	);

	const updateMemberMutation = useMutation(
		orpc.members.update.mutationOptions({
			onSuccess: () => {
				toast.success("Member updated");
				setIsEditing(false);
				refetch();
			},
			onError: (error) => {
				toast.error(
					error instanceof Error ? error.message : "Failed to update member",
				);
			},
		}),
	);

	useEffect(() => {
		if (!member || isEditing) return;
		setFormState({
			firstName: member.firstName ?? "",
			lastName: member.lastName ?? "",
			email: member.email ?? "",
			phone: member.phone ?? "",
			guardianName: member.guardianName ?? "",
			guardianEmail: member.guardianEmail ?? "",
			guardianPhone: member.guardianPhone ?? "",
			street: member.street ?? "",
			city: member.city ?? "",
			state: member.state ?? "",
			postalCode: member.postalCode ?? "",
			country: member.country ?? "",
			memberNotes: member.notes ?? "",
			contractNotes: member.contract.notes ?? "",
			contractStartDate: member.contract.startDate ?? "",
			initialPeriod: parseInitialPeriod(member.contract.initialPeriod),
			joiningFeeAmount: member.contract.joiningFeeAmount ?? "",
			yearlyFeeAmount: member.contract.yearlyFeeAmount ?? "",
		});
	}, [member, isEditing]);

	if (isPending) {
		return (
			<div className="flex flex-col gap-8">
				<Skeleton className="h-10 w-40" />
				<div className="space-y-2">
					<Skeleton className="h-10 w-80" />
					<Skeleton className="h-5 w-96" />
				</div>
				<Skeleton className="h-96" />
			</div>
		);
	}

	if (error || !member) {
		return (
			<div className="flex flex-col gap-8">
				<Link href="/dashboard/members">
					<Button variant="ghost" className="gap-2">
						<ArrowLeft className="size-4" />
						Back to Members
					</Button>
				</Link>

				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Failed to load Member</EmptyTitle>
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

	const isCancelled = !!member.contract.cancelledAt;

	// Calculate total monthly payment from groups
	const totalGroupPayment = member.groups.reduce((sum, gm) => {
		const price = gm.membershipPrice || gm.group.defaultMembershipPrice || "0";
		return sum + Number.parseFloat(price);
	}, 0);

	// Calculate total monthly payment including yearly fee (divided by 12)
	const yearlyFeeMonthly = member.contract.yearlyFeeAmount
		? Number.parseFloat(member.contract.yearlyFeeAmount) / 12
		: 0;
	const totalMonthlyPayment = totalGroupPayment + yearlyFeeMonthly;
	const isSubmitting = updateMemberMutation.isPending;

	const handleEditCancel = () => {
		setIsEditing(false);
		setFormState({
			firstName: member.firstName ?? "",
			lastName: member.lastName ?? "",
			email: member.email ?? "",
			phone: member.phone ?? "",
			guardianName: member.guardianName ?? "",
			guardianEmail: member.guardianEmail ?? "",
			guardianPhone: member.guardianPhone ?? "",
			street: member.street ?? "",
			city: member.city ?? "",
			state: member.state ?? "",
			postalCode: member.postalCode ?? "",
			country: member.country ?? "",
			memberNotes: member.notes ?? "",
			contractNotes: member.contract.notes ?? "",
			contractStartDate: member.contract.startDate ?? "",
			initialPeriod: parseInitialPeriod(member.contract.initialPeriod),
			joiningFeeAmount: member.contract.joiningFeeAmount ?? "",
			yearlyFeeAmount: member.contract.yearlyFeeAmount ?? "",
		});
	};

	const handleEditSubmit = async () => {
		await updateMemberMutation.mutateAsync({
			memberId,
			firstName: formState.firstName,
			lastName: formState.lastName,
			email: formState.email,
			phone: formState.phone,
			guardianName: formState.guardianName || undefined,
			guardianEmail: formState.guardianEmail || undefined,
			guardianPhone: formState.guardianPhone || undefined,
			street: formState.street,
			city: formState.city,
			state: formState.state,
			postalCode: formState.postalCode,
			country: formState.country,
			memberNotes: formState.memberNotes || undefined,
			contractNotes: formState.contractNotes || undefined,
			contractStartDate: formState.contractStartDate,
			initialPeriod: formState.initialPeriod,
			joiningFeeAmount: formState.joiningFeeAmount || undefined,
			yearlyFeeAmount: formState.yearlyFeeAmount || undefined,
		});
	};

	return (
		<div className="flex flex-col gap-8">
			<Link href="/dashboard/members">
				<Button variant="ghost" className="gap-2">
					<ArrowLeft className="size-4" />
					Back to Members
				</Button>
			</Link>

			<div className="space-y-2">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<h1 className="font-heading text-3xl">
							{member.firstName} {member.lastName}
						</h1>
						{isCancelled && <Badge variant="destructive">Cancelled</Badge>}
					</div>
					<div className="flex items-center gap-2">
						{isEditing ? (
							<>
								<Button
									variant="outline"
									onClick={handleEditCancel}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
								<Button onClick={handleEditSubmit} disabled={isSubmitting}>
									{isSubmitting ? "Saving..." : "Save"}
								</Button>
							</>
						) : (
							<Button variant="outline" onClick={() => setIsEditing(true)}>
								Edit
							</Button>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2 font-mono text-muted-foreground text-sm">
					<span>ID: {member.id}</span>
					<CopyButton value={member.id} />
				</div>
			</div>

			<div className="space-y-6">
				<Frame>
					<Collapsible defaultOpen={true}>
						<FrameHeader className="flex-row items-center justify-between px-2 py-2">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg:first-child]:rotate-180"
								render={<Button variant="ghost" />}
							>
								<ChevronDownIcon className="size-4" />
								<User className="size-4" />
								Personal Information
							</CollapsibleTrigger>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								<div className="grid gap-6 sm:grid-cols-2">
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											First Name
										</p>
										{isEditing ? (
											<Input
												value={formState.firstName}
												onChange={(event) =>
													setFormState((prev) => ({
														...prev,
														firstName: event.target.value,
													}))
												}
												className="mt-1"
											/>
										) : (
											<p className="mt-1 text-sm">{member.firstName}</p>
										)}
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Last Name
										</p>
										{isEditing ? (
											<Input
												value={formState.lastName}
												onChange={(event) =>
													setFormState((prev) => ({
														...prev,
														lastName: event.target.value,
													}))
												}
												className="mt-1"
											/>
										) : (
											<p className="mt-1 text-sm">{member.lastName}</p>
										)}
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Email
										</p>
										{isEditing ? (
											<Input
												type="email"
												value={formState.email}
												onChange={(event) =>
													setFormState((prev) => ({
														...prev,
														email: event.target.value,
													}))
												}
												className="mt-1"
											/>
										) : (
											<p className="mt-1 text-sm">{member.email}</p>
										)}
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Phone
										</p>
										{isEditing ? (
											<Input
												type="tel"
												value={formState.phone}
												onChange={(event) =>
													setFormState((prev) => ({
														...prev,
														phone: event.target.value,
													}))
												}
												className="mt-1"
											/>
										) : (
											<p className="mt-1 text-sm">{member.phone}</p>
										)}
									</div>
									<div className="sm:col-span-2">
										<p className="font-medium text-muted-foreground text-sm">
											Address
										</p>
										{isEditing ? (
											<div className="mt-1 grid gap-2 md:grid-cols-2">
												<Input
													value={formState.street}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															street: event.target.value,
														}))
													}
													placeholder="Street"
												/>
												<Input
													value={formState.city}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															city: event.target.value,
														}))
													}
													placeholder="City"
												/>
												<Input
													value={formState.state}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															state: event.target.value,
														}))
													}
													placeholder="State"
												/>
												<Input
													value={formState.postalCode}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															postalCode: event.target.value,
														}))
													}
													placeholder="Postal Code"
												/>
												<Input
													value={formState.country}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															country: event.target.value,
														}))
													}
													placeholder="Country"
												/>
											</div>
										) : (
											<p className="mt-1 text-sm">
												{member.street}
												<br />
												{member.postalCode} {member.city}, {member.state}
												<br />
												{member.country}
											</p>
										)}
									</div>
								</div>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

				<Frame>
					<Collapsible defaultOpen={true}>
						<FrameHeader className="flex-row items-center justify-between px-2 py-2">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg:first-child]:rotate-180"
								render={<Button variant="ghost" />}
							>
								<ChevronDownIcon className="size-4" />
								<UserPlus className="size-4" />
								Group Memberships
							</CollapsibleTrigger>
							<AssignGroupDialog memberId={member.id} />
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								<MemberGroupsTable
									groups={member.groups}
									memberId={member.id}
								/>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

				<Frame>
					<Collapsible defaultOpen={false}>
						<FrameHeader className="flex-row items-center justify-between px-2 py-2">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg:first-child]:rotate-180"
								render={<Button variant="ghost" />}
							>
								<ChevronDownIcon className="size-4" />
								<ScrollText className="size-4" />
								Contract Details
							</CollapsibleTrigger>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								<div className="space-y-6">
									<div className="grid gap-6 sm:grid-cols-3">
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Start Date
											</p>
											{isEditing ? (
												<Input
													type="date"
													value={formState.contractStartDate}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															contractStartDate: event.target.value,
														}))
													}
													className="mt-1"
												/>
											) : (
												<p className="mt-1 text-sm">
													{formatDate(member.contract.startDate)}
												</p>
											)}
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Initial Period
											</p>
											<p className="mt-1 text-sm capitalize">
												{member.contract.initialPeriod?.replace("_", " ")}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Next Billing Date
											</p>
											<p className="mt-1 text-sm">
												{formatDate(member.contract.nextBillingDate)}
											</p>
										</div>
									</div>

									<Separator />

									<div className="grid gap-4 sm:grid-cols-2">
										<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
											<div>
												<span className="font-medium text-sm">Joining Fee</span>
												<p className="text-muted-foreground text-xs">
													One-time
												</p>
											</div>
											{isEditing ? (
												<Input
													value={formState.joiningFeeAmount}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															joiningFeeAmount: event.target.value,
														}))
													}
													className="w-28"
													placeholder="0.00"
												/>
											) : (
												<span className="font-semibold text-lg">
													{formatCurrency(member.contract.joiningFeeAmount)}
												</span>
											)}
										</div>
										<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
											<div>
												<span className="font-medium text-sm">Yearly Fee</span>
												<p className="text-muted-foreground text-xs">
													{formatCurrency(yearlyFeeMonthly.toFixed(2))}/month
												</p>
											</div>
											{isEditing ? (
												<Input
													value={formState.yearlyFeeAmount}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															yearlyFeeAmount: event.target.value,
														}))
													}
													className="w-28"
													placeholder="0.00"
												/>
											) : (
												<span className="font-semibold text-lg">
													{formatCurrency(member.contract.yearlyFeeAmount)}
												</span>
											)}
										</div>
									</div>

									{isCancelled && member.contract.cancelledAt && (
										<>
											<Separator />
											<div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
												<h3 className="font-semibold text-destructive text-sm">
													Cancellation Information
												</h3>
												<div className="grid gap-4 sm:grid-cols-2">
													<div>
														<p className="font-medium text-muted-foreground text-sm">
															Cancelled On
														</p>
														<p className="mt-1 text-sm">
															{formatDate(
																member.contract.cancelledAt.toDateString(),
															)}
														</p>
													</div>
													<div>
														<p className="font-medium text-muted-foreground text-sm">
															Effective Date
														</p>
														<p className="mt-1 text-sm">
															{formatDate(
																member.contract.cancellationEffectiveDate,
															)}
														</p>
													</div>
													{member.contract.cancelReason && (
														<div className="sm:col-span-2">
															<p className="font-medium text-muted-foreground text-sm">
																Reason
															</p>
															<p className="mt-1 whitespace-pre-wrap text-sm">
																{member.contract.cancelReason}
															</p>
														</div>
													)}
												</div>
											</div>
										</>
									)}
								</div>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

				<Frame>
					<Collapsible defaultOpen={false}>
						<FrameHeader className="flex-row items-center justify-between px-2 py-2">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg:first-child]:rotate-180"
								render={<Button variant="ghost" />}
							>
								<ChevronDownIcon className="size-4" />
								<Shield className="size-4" />
								Guardian Information
							</CollapsibleTrigger>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								{isEditing ? (
									<div className="grid gap-6 sm:grid-cols-2">
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Name
											</p>
											<Input
												value={formState.guardianName}
												onChange={(event) =>
													setFormState((prev) => ({
														...prev,
														guardianName: event.target.value,
													}))
												}
												className="mt-1"
											/>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Email
											</p>
											<Input
												type="email"
												value={formState.guardianEmail}
												onChange={(event) =>
													setFormState((prev) => ({
														...prev,
														guardianEmail: event.target.value,
													}))
												}
												className="mt-1"
											/>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Phone
											</p>
											<Input
												type="tel"
												value={formState.guardianPhone}
												onChange={(event) =>
													setFormState((prev) => ({
														...prev,
														guardianPhone: event.target.value,
													}))
												}
												className="mt-1"
											/>
										</div>
									</div>
								) : member.guardianName ||
									member.guardianEmail ||
									member.guardianPhone ? (
									<div className="grid gap-6 sm:grid-cols-2">
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Name
											</p>
											<p className="mt-1 text-sm">
												{member.guardianName || "N/A"}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Email
											</p>
											<p className="mt-1 text-sm">
												{member.guardianEmail || "N/A"}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Phone
											</p>
											<p className="mt-1 text-sm">
												{member.guardianPhone || "N/A"}
											</p>
										</div>
									</div>
								) : (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<Shield />
											</EmptyMedia>
											<EmptyTitle>No Guardian Information</EmptyTitle>
											<EmptyDescription>
												No guardian information has been added for this member.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								)}
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

				<Frame>
					<Collapsible defaultOpen={false}>
						<FrameHeader className="flex-row items-center justify-between px-2 py-2">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg:first-child]:rotate-180"
								render={<Button variant="ghost" />}
							>
								<ChevronDownIcon className="size-4" />
								<FileText className="size-4" />
								Notes
							</CollapsibleTrigger>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								<div className="space-y-4">
									{isEditing ? (
										<div className="space-y-4">
											<div>
												<p className="font-medium text-muted-foreground text-sm">
													Member Notes
												</p>
												<Textarea
													value={formState.memberNotes}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															memberNotes: event.target.value,
														}))
													}
													className="mt-2"
													rows={3}
												/>
											</div>
											<div>
												<p className="font-medium text-muted-foreground text-sm">
													Contract Notes
												</p>
												<Textarea
													value={formState.contractNotes}
													onChange={(event) =>
														setFormState((prev) => ({
															...prev,
															contractNotes: event.target.value,
														}))
													}
													className="mt-2"
													rows={3}
												/>
											</div>
										</div>
									) : (
										<>
											{member.notes && (
												<div>
													<p className="font-medium text-muted-foreground text-sm">
														Member Notes
													</p>
													<p className="mt-2 whitespace-pre-wrap text-sm">
														{member.notes}
													</p>
												</div>
											)}
											{member.contract.notes && (
												<>
													{member.notes && <Separator />}
													<div>
														<p className="font-medium text-muted-foreground text-sm">
															Contract Notes
														</p>
														<p className="mt-2 whitespace-pre-wrap text-sm">
															{member.contract.notes}
														</p>
													</div>
												</>
											)}
											{!member.notes && !member.contract.notes && (
												<Empty>
													<EmptyHeader>
														<EmptyMedia variant="icon">
															<FileText />
														</EmptyMedia>
														<EmptyTitle>No Notes</EmptyTitle>
														<EmptyDescription>
															No notes have been added for this member yet.
														</EmptyDescription>
													</EmptyHeader>
												</Empty>
											)}
										</>
									)}
								</div>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

				<Frame>
					<Collapsible defaultOpen={false}>
						<FrameHeader className="flex-row items-center justify-between px-2 py-2">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg:first-child]:rotate-180"
								render={<Button variant="ghost" />}
							>
								<ChevronDownIcon className="size-4" />
								<CreditCard className="size-4" />
								Payment Information
							</CollapsibleTrigger>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								{paymentDetailsQuery.data ? (
									<div className="grid gap-6 sm:grid-cols-2">
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												IBAN
											</p>
											<p className="mt-1 font-mono text-sm">
												{paymentDetailsQuery.data.iban}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												BIC
											</p>
											<p className="mt-1 font-mono text-sm">
												{paymentDetailsQuery.data.bic}
											</p>
										</div>
										<div className="sm:col-span-2">
											<p className="font-medium text-muted-foreground text-sm">
												Account Holder
											</p>
											<p className="mt-1 text-sm">
												{paymentDetailsQuery.data.cardHolder}
											</p>
										</div>
									</div>
								) : paymentDetailsQuery.error ? (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<CreditCard />
											</EmptyMedia>
											<EmptyTitle>No Permission</EmptyTitle>
											<EmptyDescription>
												You don't have permission to view payment information.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : (
									<div className="flex items-center justify-between gap-4">
										<div>
											<p className="font-medium text-sm">
												View payment details
											</p>
											<p className="text-muted-foreground text-xs">
												Sensitive information. Access is audited.
											</p>
										</div>
										<Button
											variant="outline"
											onClick={() => paymentDetailsQuery.refetch()}
											disabled={paymentDetailsQuery.isFetching}
										>
											{paymentDetailsQuery.isFetching ? "Loading..." : "View"}
										</Button>
									</div>
								)}
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>
			</div>
		</div>
	);
}
