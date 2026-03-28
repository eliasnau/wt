"use client";

import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowLeft,
	ChevronDownIcon,
	Copy,
	FileText,
	ScrollText,
	Shield,
	User,
	UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatCents } from "@/utils/billing";
import { orpc } from "@/utils/orpc";
import { CancelMemberDialog } from "../_components/cancel-member-dialog";
import { AssignGroupDialog } from "./_components/assign-group-dialog";
import { MemberBillingSection } from "./_components/member-billing-section";
import { MemberGroupsTable } from "./_components/member-groups-table";
import { UpdateMemberDetailsSheet } from "./_components/update-member-details-sheet";

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return "-";
	const [year, month, day] = dateString.split("-").map((part) => Number(part));
	if (!year || !month || !day) return "-";
	return new Date(year, month - 1, day).toLocaleDateString("de-DE", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatCurrency(amountCents: number | null | undefined) {
	return formatCents(amountCents ?? 0);
}

function CopyButton({ value }: { value: string }) {
	const { copyToClipboard, isCopied } = useCopyToClipboard({
		onCopy: () => toast.success("In Zwischenablage kopiert"),
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
			title="In Zwischenablage kopieren"
		>
			<Copy className="size-3.5" />
			{isCopied && <span className="text-xs">Kopiert!</span>}
		</button>
	);
}

export default function MemberDetailPage() {
	const params = useParams();
	const memberId = params.id as string;
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

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
				<Button
					variant="ghost"
					className="gap-2"
					render={<Link href="/dashboard/members" />}
				>
					<ArrowLeft className="size-4" />
					Zurück zu Mitgliedern
				</Button>

				<Frame>
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Mitglied konnte nicht geladen werden</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => refetch()}>Erneut versuchen</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
				</Frame>
			</div>
		);
	}

	const isCancelled = !!member.contract.cancelledAt;
	const memberName = `${member.firstName} ${member.lastName}`.trim();

	// Calculate total monthly payment from groups (in cents)
	const totalGroupPaymentCents = member.groups.reduce((sum, gm) => {
		return sum + (gm.membershipPriceCents ?? 0);
	}, 0);

	// Calculate yearly fee per month (in cents, rounded to avoid fractional cents)
	const yearlyFeeMonthly = member.contract.yearlyFeeCents
		? Math.round(member.contract.yearlyFeeCents / 12)
		: 0;

	return (
		<div className="flex flex-col gap-8">
			<Link href="/dashboard/members">
				<Button variant="ghost" className="gap-2">
					<ArrowLeft className="size-4" />
					Zurück zu Mitgliedern
				</Button>
			</Link>

			<div className="space-y-2">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<h1 className="font-heading text-3xl">
							{member.firstName} {member.lastName}
						</h1>
						{isCancelled && <Badge variant="destructive">Gekündigt</Badge>}
					</div>
					{!isCancelled && (
						<Button
							variant="destructive"
							onClick={() => setCancelDialogOpen(true)}
						>
							Mitgliedschaft kündigen
						</Button>
					)}
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
								Persönliche Daten
							</CollapsibleTrigger>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDetailsSheetOpen(true)}
							>
								Daten bearbeiten
							</Button>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								<div className="grid gap-6 sm:grid-cols-2">
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Vorname
										</p>
										<p className="mt-1 text-sm">{member.firstName}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Nachname
										</p>
										<p className="mt-1 text-sm">{member.lastName}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Geburtsdatum
										</p>
										<p className="mt-1 text-sm">{formatDate(member.birthdate)}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											E-Mail
										</p>
										<p className="mt-1 text-sm">{member.email || "-"}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Telefon
										</p>
										<p className="mt-1 text-sm">{member.phone || "-"}</p>
									</div>
									<div className="sm:col-span-2">
										<p className="font-medium text-muted-foreground text-sm">
											Adresse
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
								Gruppenmitgliedschaften
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
								Vertragsdetails
							</CollapsibleTrigger>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								<div className="space-y-6">
									<div className="grid gap-6 sm:grid-cols-3">
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Startdatum
											</p>
											<p className="mt-1 text-sm">
												{formatDate(member.contract.startDate)}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Erstlaufzeit
											</p>
											<p className="mt-1 text-sm capitalize">
												{member.contract.initialPeriod?.replace("_", " ")}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Status
											</p>
											<p className="mt-1 text-sm capitalize">
												{member.contract.status}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Ende der Erstlaufzeit
											</p>
											<p className="mt-1 text-sm">
												{formatDate(member.contract.initialPeriodEndDate)}
											</p>
										</div>
									</div>

									<Separator />

									<div className="grid gap-4 sm:grid-cols-2">
										<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
											<div>
												<span className="font-medium text-sm">
													Aufnahmegebühr
												</span>
												<p className="text-muted-foreground text-xs">
													Einmalig
												</p>
											</div>
											<span className="font-semibold text-lg">
												{formatCurrency(member.contract.joiningFeeCents)}
											</span>
										</div>
										<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
											<div>
												<span className="font-medium text-sm">
													Jahresbeitrag
												</span>
												<p className="text-muted-foreground text-xs">
													{formatCents(yearlyFeeMonthly)}/Monat
												</p>
											</div>
											<span className="font-semibold text-lg">
												{formatCurrency(member.contract.yearlyFeeCents)}
											</span>
										</div>
									</div>

									{isCancelled && member.contract.cancelledAt && (
										<>
											<Separator />
											<div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
												<h3 className="font-semibold text-destructive text-sm">
													Kündigungsinformationen
												</h3>
												<div className="grid gap-4 sm:grid-cols-2">
													<div>
														<p className="font-medium text-muted-foreground text-sm">
															Gekündigt am
														</p>
														<p className="mt-1 text-sm">
															{formatDate(
																member.contract.cancelledAt.toDateString(),
															)}
														</p>
													</div>
													<div>
														<p className="font-medium text-muted-foreground text-sm">
															Wirksam zum
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
																Grund
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

				<MemberBillingSection
					memberId={member.id}
					contractId={member.contract.id}
					memberName={memberName}
				/>

				<Frame>
					<Collapsible defaultOpen={false}>
						<FrameHeader className="flex-row items-center justify-between px-2 py-2">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg:first-child]:rotate-180"
								render={<Button variant="ghost" />}
							>
								<ChevronDownIcon className="size-4" />
								<Shield className="size-4" />
								Daten Erziehungsberechtigte
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
												{member.guardianName || "-"}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												E-Mail
											</p>
											<p className="mt-1 text-sm">
												{member.guardianEmail || "-"}
											</p>
										</div>
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Telefon
											</p>
											<p className="mt-1 text-sm">
												{member.guardianPhone || "-"}
											</p>
										</div>
									</div>
								) : (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<Shield />
											</EmptyMedia>
											<EmptyTitle>
												Keine Angaben zum Erziehungsberechtigten
											</EmptyTitle>
											<EmptyDescription>
												Für dieses Mitglied wurden noch keine Angaben zu
												Erziehungsberechtigten hinterlegt.
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
								Notizen
							</CollapsibleTrigger>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel>
								<div className="space-y-4">
									{member.notes && (
										<div>
											<p className="font-medium text-muted-foreground text-sm">
												Notizen zum Mitglied
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
													Vertragsnotizen
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
												<EmptyTitle>Keine Notizen</EmptyTitle>
												<EmptyDescription>
													Für dieses Mitglied wurden noch keine Notizen
													hinterlegt.
												</EmptyDescription>
											</EmptyHeader>
										</Empty>
									)}
								</div>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

			</div>

			<CancelMemberDialog
				memberId={member.id}
				memberName={memberName}
				initialPeriodEndDate={member.contract.initialPeriodEndDate}
				open={cancelDialogOpen}
				onOpenChange={setCancelDialogOpen}
				onSuccess={() => refetch()}
			/>
			<UpdateMemberDetailsSheet
				memberId={member.id}
				open={detailsSheetOpen}
				onOpenChange={setDetailsSheetOpen}
				initialValues={{
					firstName: member.firstName ?? "",
					lastName: member.lastName ?? "",
					birthdate: member.birthdate ?? "",
					email: member.email ?? "",
					phone: member.phone ?? "",
					street: member.street ?? "",
					city: member.city ?? "",
					state: member.state ?? "",
					postalCode: member.postalCode ?? "",
					country: member.country ?? "",
				}}
			/>
		</div>
	);
}
