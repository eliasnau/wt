import {
	ArrowRight,
	BadgeCheck,
	BarChart3,
	CreditCard,
	Settings,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { requireActiveOrg } from "@/lib/auth";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../_components/page-header";

export default async function DashboardPage() {
	const { session, organization } = await requireActiveOrg();
	const memberCount = organization.members?.length ?? 0;
	const firstName = session.user?.name?.split(" ")[0] ?? "there";
	const greeting = getGreeting();

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>{organization.name}</HeaderTitle>
					<HeaderDescription></HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Button
						variant="outline"
						render={
							<Link href="/dashboard/settings/general">
								<Settings className="size-4" />
								Settings
							</Link>
						}
					/>
					<Button
						render={
							<Link href="/dashboard/members/new">
								<UserPlus className="size-4" />
								Add Member
							</Link>
						}
					/>
				</HeaderActions>
			</Header>

			<section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
				<Card className="relative min-h-[360px] overflow-hidden">
					<div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
					<div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
					<CardHeader className="relative space-y-3">
						<CardTitle className="text-2xl md:text-3xl">
							{greeting}, {firstName}
						</CardTitle>
						<CardDescription className="max-w-xl">
							Quick access to members, groups, and payments — everything you
							need to keep the studio organized.
						</CardDescription>
					</CardHeader>
					<CardContent className="relative">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="rounded-lg border bg-background/80 p-4 shadow-sm backdrop-blur">
								<div className="font-medium text-muted-foreground text-xs uppercase">
									Active Members
								</div>
								<div className="mt-2 font-semibold text-2xl">{memberCount}</div>
								<p className="text-muted-foreground text-xs">
									People training this month
								</p>
							</div>
							<div className="rounded-lg border bg-background/80 p-4 shadow-sm backdrop-blur">
								<div className="font-medium text-muted-foreground text-xs uppercase">
									Statistics
								</div>
								<div className="mt-2 font-semibold text-2xl">Diesen Monat</div>
								<p className="text-muted-foreground text-xs">
									Attendance and revenue trends
								</p>
							</div>
						</div>
					</CardContent>
					<CardFooter className="relative gap-3">
						<Button
							render={
								<Link href="/dashboard/members">
									<Users className="size-4" />
									View Members
								</Link>
							}
						/>
						<Button
							variant="outline"
							render={
								<Link href="/dashboard/statistics/overview">
									<BarChart3 className="size-4" />
									This Month’s Statistics
								</Link>
							}
						/>
					</CardFooter>
				</Card>

				<Card className="min-h-[360px]">
					<CardHeader>
						<CardTitle>Schnellaktionen</CardTitle>
						<CardDescription>
							Move fast with a few high-impact shortcuts.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Link
							href="/dashboard/members/new"
							className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 text-sm transition hover:border-foreground/20 hover:bg-accent"
						>
							<span className="flex items-center gap-3">
								<span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
									<UserPlus className="size-4" />
								</span>
								Add a new member
							</span>
							<ArrowRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
						</Link>
						<Link
							href="/dashboard/groups"
							className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 text-sm transition hover:border-foreground/20 hover:bg-accent"
						>
							<span className="flex items-center gap-3">
								<span className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
									<Users className="size-4" />
								</span>
								Organize student groups
							</span>
							<ArrowRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
						</Link>
						<Link
							href="/dashboard/finance/sepa"
							className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 text-sm transition hover:border-foreground/20 hover:bg-accent"
						>
							<span className="flex items-center gap-3">
								<span className="flex size-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
									<CreditCard className="size-4" />
								</span>
								Generate SEPA file
							</span>
							<ArrowRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
						</Link>
						<Link
							href="/dashboard/settings/members"
							className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 text-sm transition hover:border-foreground/20 hover:bg-accent"
						>
							<span className="flex items-center gap-3">
								<span className="flex size-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
									<Settings className="size-4" />
								</span>
								Invite staff and admins
							</span>
							<ArrowRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
						</Link>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}
