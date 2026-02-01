"use client";

import { useQuery } from "@tanstack/react-query";
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
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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

function CopyButton({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 1000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
			title="Copy to clipboard"
		>
			<Copy className="size-3.5" />
			{copied && <span className="text-xs">Copied!</span>}
		</button>
	);
}

export default function MemberDetailPage() {
	const params = useParams();
	const memberId = params.id as string;

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

	return (
		<div className="flex flex-col gap-8">
			<Link href="/dashboard/members">
				<Button variant="ghost" className="gap-2">
					<ArrowLeft className="size-4" />
					Back to Members
				</Button>
			</Link>

			<div className="space-y-2">
				<div className="flex items-center gap-3">
					<h1 className="font-heading text-3xl">
						{member.firstName} {member.lastName}
					</h1>
					{isCancelled && <Badge variant="destructive">Cancelled</Badge>}
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
										<p className="mt-1 text-sm">{member.firstName}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Last Name
										</p>
										<p className="mt-1 text-sm">{member.lastName}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Email
										</p>
										<p className="mt-1 text-sm">{member.email}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Phone
										</p>
										<p className="mt-1 text-sm">{member.phone}</p>
									</div>
									<div className="sm:col-span-2">
										<p className="font-medium text-muted-foreground text-sm">
											Address
										</p>
										<p className="mt-1 text-sm">
											{member.street}
											<br />
											{member.postalCode} {member.city}, {member.state}
											<br />
											{member.country}
										</p>
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
								<MemberGroupsTable groups={member.groups} />
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
											<p className="mt-1 text-sm">
												{formatDate(member.contract.startDate)}
											</p>
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
											<span className="font-semibold text-lg">
												{formatCurrency(member.contract.joiningFeeAmount)}
											</span>
										</div>
										<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
											<div>
												<span className="font-medium text-sm">Yearly Fee</span>
												<p className="text-muted-foreground text-xs">
													{formatCurrency(yearlyFeeMonthly.toFixed(2))}/month
												</p>
											</div>
											<span className="font-semibold text-lg">
												{formatCurrency(member.contract.yearlyFeeAmount)}
											</span>
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
								{member.guardianName ||
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
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>
			</div>
		</div>
	);
}
