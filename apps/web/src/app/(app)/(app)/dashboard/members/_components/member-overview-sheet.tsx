"use client";

import type { InferClientOutputs } from "@orpc/client";
import { differenceInMonths, format } from "date-fns";
import { ArrowRightIcon, MailIcon, PhoneIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { CopyableTableCell } from "@/components/table/copyable-table-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
} from "@/components/ui/sheet";
import type { client } from "@/utils/orpc";

type MembersListResponse = InferClientOutputs<typeof client>["members"]["list"];
type MemberRow = MembersListResponse["data"][number];

interface MemberOverviewSheetProps {
	member: MemberRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function MemberOverviewSheet({
	member,
	open,
	onOpenChange,
}: MemberOverviewSheetProps) {
	const router = useRouter();

	if (!member) return null;

	const isCancelled = member.contract?.cancelledAt !== null;
	const cancellationEffectiveDate = member.contract?.cancellationEffectiveDate;
	const groupMembers = member.groupMembers ?? [];

	// Calculate membership duration in months
	const monthsWithUs = member.contract?.startDate
		? differenceInMonths(new Date(), new Date(member.contract.startDate))
		: 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetPopup inset side="right">
				<SheetHeader>
					<div className="flex items-start justify-between gap-4">
						<SheetTitle>
							{member.firstName} {member.lastName}
						</SheetTitle>
						{isCancelled && (
							<Badge variant="outline">
								<span
									aria-hidden="true"
									className="size-1.5 rounded-full bg-red-500"
								/>
								Cancelled
							</Badge>
						)}
					</div>
				</SheetHeader>

				<SheetPanel>
					<div className="flex flex-col gap-6 py-6">
						<div className="space-y-3">
							<h4 className="font-medium text-foreground text-sm">
								Contact Information
							</h4>
							<div className="space-y-2">
								<div className="flex items-center gap-3 text-sm">
									<MailIcon className="size-4 text-muted-foreground" />
									<CopyableTableCell value={member.email} />
								</div>
								<div className="flex items-center gap-3 text-sm">
									<PhoneIcon className="size-4 text-muted-foreground" />
									<CopyableTableCell value={member.phone} />
								</div>
							</div>
						</div>

						{(member.guardianName ||
							member.guardianEmail ||
							member.guardianPhone) && (
							<>
								<Separator />
								<div className="space-y-3">
									<h4 className="font-medium text-foreground text-sm">
										Guardian Information
									</h4>
									<div className="space-y-2">
										{member.guardianName && (
											<div className="flex items-center gap-3 text-sm">
												<UserIcon className="size-4 text-muted-foreground" />
												<span className="text-foreground">
													{member.guardianName}
												</span>
											</div>
										)}
										{member.guardianEmail && (
											<div className="flex items-center gap-3 text-sm">
												<MailIcon className="size-4 text-muted-foreground" />
												<CopyableTableCell value={member.guardianEmail} />
											</div>
										)}
										{member.guardianPhone && (
											<div className="flex items-center gap-3 text-sm">
												<PhoneIcon className="size-4 text-muted-foreground" />
												<CopyableTableCell value={member.guardianPhone} />
											</div>
										)}
									</div>
								</div>
							</>
						)}

						<Separator />

						<div className="space-y-3">
							<h4 className="font-medium text-foreground text-sm">Address</h4>
							<div className="text-sm">
								<p className="text-foreground">{member.street}</p>
								<p className="text-foreground">
									{member.city}, {member.state} {member.postalCode}
								</p>
								<p className="text-foreground">{member.country}</p>
							</div>
						</div>

						<Separator />

						<div className="space-y-3">
							<h4 className="font-medium text-foreground text-sm">Groups</h4>
							{groupMembers.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No groups assigned
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{groupMembers.map((gm) => (
										<Badge variant="outline" key={gm.groupId}>
											{gm.group.name}
										</Badge>
									))}
								</div>
							)}
						</div>

						<Separator />

						{member.contract && (
							<>
								<div className="space-y-3">
									<h4 className="font-medium text-foreground text-sm">
										Contract Details
									</h4>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Start Date</span>
											<span className="text-foreground">
												{format(new Date(member.contract.startDate), "PPP")}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Membership Duration
											</span>
											<span className="text-foreground">
												{monthsWithUs} {monthsWithUs === 1 ? "month" : "months"}
											</span>
										</div>
										{member.contract.joiningFeeAmount && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Joining Fee
												</span>
												<span className="text-foreground">
													€{member.contract.joiningFeeAmount}
												</span>
											</div>
										)}
										{member.contract.yearlyFeeAmount && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Yearly Fee
												</span>
												<span className="text-foreground">
													€{member.contract.yearlyFeeAmount}
												</span>
											</div>
										)}
										{isCancelled && cancellationEffectiveDate && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Ends On</span>
												<span className="text-foreground">
													{format(new Date(cancellationEffectiveDate), "PPP")}
												</span>
											</div>
										)}
									</div>
								</div>
								<Separator />
							</>
						)}

						<div className="space-y-3">
							<h4 className="font-medium text-foreground text-sm">Notes</h4>
							{member.notes || member.contract?.notes ? (
								<div className="space-y-3">
									{member.notes && (
										<div>
											<p className="font-medium text-muted-foreground text-xs uppercase">
												Member Notes
											</p>
											<p className="mt-1 text-foreground text-sm leading-relaxed">
												{member.notes}
											</p>
										</div>
									)}
									{member.contract?.notes && (
										<div>
											<p className="font-medium text-muted-foreground text-xs uppercase">
												Contract Notes
											</p>
											<p className="mt-1 text-foreground text-sm leading-relaxed">
												{member.contract.notes}
											</p>
										</div>
									)}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">No notes</p>
							)}
						</div>
					</div>
				</SheetPanel>

				<SheetFooter className="gap-2">
					<SheetClose
						render={
							<Button type="button" variant="outline">
								Close
							</Button>
						}
					/>
					<Button
						type="button"
						onClick={() => {
							router.push(`/dashboard/members/${member.id}`);
							onOpenChange(false);
						}}
					>
						View Full Details
						<ArrowRightIcon />
					</Button>
				</SheetFooter>
			</SheetPopup>
		</Sheet>
	);
}
