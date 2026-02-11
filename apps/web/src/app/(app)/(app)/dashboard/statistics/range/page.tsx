"use client";

import {
	Header,
	HeaderContent,
	HeaderTitle,
	HeaderDescription,
	HeaderActions,
} from "../../_components/page-header";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, eachMonthOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { MembershipChart } from "../_components/membership-chart";
import { GroupsChart } from "../_components/groups-chart";
import { RevenueChart } from "../_components/revenue-chart";
import { TotalMembersChart } from "../_components/total-members-chart";
import { TotalRevenueChart } from "../_components/income-chart";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";

export default function RangeComparisonPage() {
	const [startDate, setStartDate] = useState<Date | undefined>(
		new Date(2024, 0, 1),
	);
	const [endDate, setEndDate] = useState<Date | undefined>(
		new Date(2024, 11, 31),
	);

	const getRangeText = (start: Date | undefined, end: Date | undefined) => {
		if (!start || !end) return "Datumsbereich wählen";
		return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
	};

	const getMonthsInRange = () => {
		if (!startDate || !endDate) return [];
		return eachMonthOfInterval({ start: startDate, end: endDate });
	};

	const monthsInRange = getMonthsInRange();

	const generateMonthData = (month: Date) => {
		const monthIndex = month.getMonth();
		return {
			month: format(month, "MMMM yyyy"),
			totalMembers: 1200 + monthIndex * 15,
			newMembers: 50 + Math.floor(Math.random() * 50),
			cancellations: 10 + Math.floor(Math.random() * 15),
			totalRevenue: `€${(40000 + monthIndex * 2000).toLocaleString()}.00`,
			pendingPayments: `€${(3000 + Math.floor(Math.random() * 2000)).toLocaleString()}.00`,
		};
	};

	const monthlyData = monthsInRange.map(generateMonthData);

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Compare Months</HeaderTitle>
					<HeaderDescription>
						Analyze membership and revenue trends across a custom date range
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Popover>
						<PopoverTrigger
							render={(props) => (
								<Button
									{...props}
									variant="outline"
									className={cn(
										"w-[280px] justify-start text-left font-normal",
										(!startDate || !endDate) && "text-muted-foreground",
									)}
								>
									<Calendar className="mr-2 h-4 w-4" />
									{getRangeText(startDate, endDate)}
								</Button>
							)}
						/>
						<PopoverContent className="w-auto p-0" align="end">
							<div className="flex flex-col gap-2 p-3">
								<div className="space-y-2">
									<p className="text-sm font-medium">Startdatum</p>
									<CalendarComponent
										mode="single"
										selected={startDate}
										onSelect={setStartDate}
										initialFocus
									/>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium">Enddatum</p>
									<CalendarComponent
										mode="single"
										selected={endDate}
										onSelect={setEndDate}
										disabled={(date) => (startDate ? date < startDate : false)}
									/>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</HeaderActions>
			</Header>

			<div className="space-y-6">
				<Frame>
					<Collapsible defaultOpen>
						<FrameHeader className="flex-row items-center justify-between px-4 py-3">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg]:rotate-180"
								render={(props) => (
									<Button variant="ghost" {...props}>
										<ChevronDownIcon className="size-4 mr-2" />
										<span className="font-semibold text-sm">
											Membership Analytics
										</span>
									</Button>
								)}
							/>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel className="space-y-6">
								<MembershipChart />
								<div className="grid gap-6 md:grid-cols-2">
									<TotalMembersChart />
									<GroupsChart />
								</div>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>

				<Frame>
					<Collapsible defaultOpen>
						<FrameHeader className="flex-row items-center justify-between px-4 py-3">
							<CollapsibleTrigger
								className="data-panel-open:[&_svg]:rotate-180"
								render={(props) => (
									<Button variant="ghost" {...props}>
										<ChevronDownIcon className="size-4 mr-2" />
										<span className="font-semibold text-sm">
											Financial Analytics
										</span>
									</Button>
								)}
							/>
						</FrameHeader>
						<CollapsiblePanel>
							<FramePanel className="space-y-6">
								<div className="grid gap-6 md:grid-cols-2">
									<TotalRevenueChart />
									<RevenueChart />
								</div>
							</FramePanel>
						</CollapsiblePanel>
					</Collapsible>
				</Frame>
			</div>
		</div>
	);
}
