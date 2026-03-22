import { BarChart3, CreditCard, Settings, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
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
	const firstName = session.user?.name?.split(" ")[0] ?? "dir";
	const greeting = getGreeting();

	return (
		<div className="flex flex-col gap-6">
			<Header>
				<HeaderContent>
					<HeaderTitle>
						{greeting}, {firstName}
					</HeaderTitle>
					<HeaderDescription>{organization.name}</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Button
						variant="outline"
						render={
							<Link href="/dashboard/settings/general">
								<Settings className="size-4" />
								Einstellungen
							</Link>
						}
					/>
					<Button
						render={
							<Link href="/dashboard/members/new">
								<UserPlus className="size-4" />
								Mitglied hinzufügen
							</Link>
						}
					/>
				</HeaderActions>
			</Header>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<QuickAction
					href="/dashboard/members"
					icon={Users}
					label="Mitglieder"
					description="Anzeigen und verwalten"
				/>
				<QuickAction
					href="/dashboard/groups"
					icon={Users}
					label="Gruppen"
					description="Trainingsgruppen organisieren"
				/>
				<QuickAction
					href="/dashboard/finance/batches"
					icon={CreditCard}
					label="Finanzen"
					description="Zahlungen und Rechnungen"
				/>
				<QuickAction
					href="/dashboard/statistics/overview"
					icon={BarChart3}
					label="Statistiken"
					description="Anwesenheit & Trends"
				/>
			</div>
		</div>
	);
}

function QuickAction({
	href,
	icon: Icon,
	label,
	description,
}: {
	href: string;
	icon: ComponentType<{ className?: string }>;
	label: string;
	description: string;
}) {
	return (
		<Link
			href={href}
			className="group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
		>
			<div className="flex items-center gap-3">
				<div className="flex size-9 items-center justify-center rounded-md bg-muted">
					<Icon className="size-4 text-muted-foreground" />
				</div>
				<span className="font-medium">{label}</span>
			</div>
			<p className="text-muted-foreground text-sm">{description}</p>
		</Link>
	);
}

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Guten Morgen";
	if (hour < 18) return "Guten Tag";
	return "Guten Abend";
}
