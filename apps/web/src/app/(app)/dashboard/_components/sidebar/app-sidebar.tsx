"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
	Activity,
	DollarSign,
	Home,
	Infinity,
	Layers,
	LinkIcon,
	Package2,
	Percent,
	PieChart,
	Calendar,
	Settings,
	ShoppingBag,
	Sparkles,
	Store,
	TrendingUp,
	User2,
	Users,
	Users2,
} from "lucide-react";
import { Logo } from "@/app/(app)/dashboard/_components/sidebar/logo";
import { UserButton } from "@/app/(app)/dashboard/_components/sidebar/user-button";
import type { Route } from "./nav-main";
import DashboardNavigation from "@/app/(app)/dashboard/_components/sidebar/nav-main";
import { NotificationsPopover } from "@/app/(app)/dashboard/_components/sidebar/nav-notifications";

const sampleNotifications = [
	{
		id: "1",
		avatar: "/avatars/01.png",
		fallback: "OM",
		text: "New order received.",
		time: "10m ago",
	},
	{
		id: "2",
		avatar: "/avatars/02.png",
		fallback: "JL",
		text: "Server upgrade completed.",
		time: "1h ago",
	},
	{
		id: "3",
		avatar: "/avatars/03.png",
		fallback: "HH",
		text: "New user signed up.",
		time: "2h ago",
	},
];

const dashboardRoutes: Route[] = [
	{
		id: "home",
		title: "Home",
		icon: <Home className="size-4" />,
		link: "/dashboard",
	},
	{
		id: "Members",
		title: "Members",
		icon: <Users className="size-4" />,
		link: "/dashboard/members",
	},
	{
		id: "groups",
		title: "Groups",
		icon: <Layers className="size-4" />,
		link: "/dashboard/groups",
	},
	{
		id: "statistics",
		title: "Statistics",
		icon: <PieChart className="size-4" />,
		link: "/dashboard/statistics/overview",
		subs: [
			{
				title: "Overview",
				link: "/dashboard/statistics/overview",
				icon: <PieChart className="size-4" />,
			},
			{
				title: "Compare Months",
				link: "/dashboard/statistics/range",
				icon: <PieChart className="size-4" />,
			},
		],
	},
	{
		id: "employees",
		title: "Employees",
		icon: <Users className="size-4" />,
		link: "/dashboard/employees",
	},
	{
		id: "events",
		title: "Events",
		icon: <Calendar className="size-4" />,
		link: "/dashboard/events",
		subs: [
			{
				title: "Calendar",
				link: "#",
				icon: <ShoppingBag className="size-4" />,
			},
			{
				title: "Events",
				link: "#",
				icon: <Infinity className="size-4" />,
			},
		],
	},
	{
		id: "storefront",
		title: "Storefront",
		icon: <Store className="size-4" />,
		link: "#",
	},
	{
		id: "analytics",
		title: "Analytics",
		icon: <TrendingUp className="size-4" />,
		link: "#",
	},
	{
		id: "finance",
		title: "Finance",
		icon: <DollarSign className="size-4" />,
		link: "#",
		subs: [
			{ title: "Overview", link: "#" },
			{ title: "Generate SEPA", link: "#" },
			{ title: "History", link: "#" },
		],
	},
	{
		id: "settings",
		title: "Settings",
		icon: <Settings className="size-4" />,
		link: "/dashboard/settings",
		subs: [
			{ title: "General", link: "/dashboard/settings/general" },
			{ title: "SEPA", link: "/dashboard/settings/sepa" },
			{ title: "Billing", link: "#" },
		],
	},
];

export function DashboardSidebar() {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	return (
		<Sidebar variant="inset" collapsible="icon">
			<SidebarHeader
				className={cn(
					"flex md:pt-3.5",
					isCollapsed
						? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
						: "flex-row items-center justify-between",
				)}
			>
				<Logo />

				<motion.div
					key={isCollapsed ? "header-collapsed" : "header-expanded"}
					className={cn(
						"flex items-center gap-2",
						isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row",
					)}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8 }}
				>
					<NotificationsPopover notifications={sampleNotifications} />
					<SidebarTrigger />
				</motion.div>
			</SidebarHeader>
			<SidebarContent className="gap-4 px-2 py-4">
				<DashboardNavigation routes={dashboardRoutes} />
			</SidebarContent>
			<SidebarFooter className="px-2">
				<UserButton />
			</SidebarFooter>
		</Sidebar>
	);
}
