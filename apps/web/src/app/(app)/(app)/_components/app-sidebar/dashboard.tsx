"use client";

import {
	ClipboardCheck,
	ChevronDown,
	ChevronUp,
	DollarSign,
	PieChart,
	Sparkles,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { Blocks } from "@/components/animate-ui/icons/blocks";
import { ChartLine } from "@/components/animate-ui/icons/chart-line";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard";
import { SlidersHorizontal } from "@/components/animate-ui/icons/sliders-horizontal";
import { Users } from "@/components/animate-ui/icons/users";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarContent,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuItem as SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavRoute = {
	id: string;
	title: string;
	icon?: React.ReactNode;
	link: string;
	subs?: {
		title: string;
		link: string;
		icon?: React.ReactNode;
	}[];
};

const routes: NavRoute[] = [
	{
		id: "home",
		title: "Startseite",
		icon: <LayoutDashboard className="size-4" />,
		link: "/dashboard",
	},
	{
		id: "Members",
		title: "Mitglieder",
		icon: <Users className="size-4" size={16} />,
		link: "/dashboard/members",
	},
	{
		id: "groups",
		title: "Gruppen",
		icon: <Blocks className="size-4" />,
		link: "/dashboard/groups",
	},
	{
		id: "ai",
		title: "KI-Assistent",
		icon: <Sparkles className="size-4" />,
		link: "/dashboard/ai",
	},
	{
		id: "statistics",
		title: "Statistiken",
		icon: <ChartLine className="size-4" />,
		link: "/dashboard/statistics/overview",
		subs: [
			{
				title: "Übersicht",
				link: "/dashboard/statistics/overview",
				icon: <PieChart className="size-4" />,
			},
			{
				title: "Monate vergleichen",
				link: "/dashboard/statistics/range",
				icon: <PieChart className="size-4" />,
			},
		],
	},
	{
		id: "finance",
		title: "Finanzen",
		icon: <DollarSign className="size-4" />,
		link: "/dashboard/finance/batches",
		subs: [
			{ title: "Zahlungsläufe", link: "/dashboard/finance/batches" },
			{ title: "SEPA erstellen", link: "/dashboard/finance/sepa" },
		],
	},
	{
		id: "self-service",
		title: "Self-Service",
		icon: <ClipboardCheck className="size-4" />,
		link: "/dashboard/self-service/registrations",
		subs: [
			{
				title: "Registrierungen",
				link: "/dashboard/self-service/registrations",
			},
		],
	},
	{
		id: "settings",
		title: "Einstellungen",
		icon: <SlidersHorizontal className="size-4" />,
		link: "/dashboard/settings",
		subs: [
			{ title: "Allgemein", link: "/dashboard/settings/general" },
			{ title: "Benutzer", link: "/dashboard/settings/members" },
			{ title: "SEPA", link: "/dashboard/settings/sepa" },
		],
	},
];

export function DashboardLayout() {
	const { state } = useSidebar();
	const pathname = usePathname();
	const isCollapsed = state === "collapsed";
	const activeCollapsibleId = useMemo(() => {
		const activeParent = routes.find((route) =>
			route.subs?.some((sub) => pathname?.startsWith(sub.link)),
		);
		return activeParent?.id ?? null;
	}, [pathname]);

	const [openCollapsible, setOpenCollapsible] = useState<string | null>(
		activeCollapsibleId,
	);
	const [prevActiveCollapsibleId, setPrevActiveCollapsibleId] =
		useState(activeCollapsibleId);

	if (activeCollapsibleId !== prevActiveCollapsibleId) {
		setPrevActiveCollapsibleId(activeCollapsibleId);
		if (activeCollapsibleId) {
			setOpenCollapsible(activeCollapsibleId);
		}
	}

	const isRouteActive = (link: string) =>
		link === "/dashboard"
			? pathname === "/dashboard"
			: Boolean(pathname?.startsWith(link));

	return (
		<SidebarContent>
			<SidebarGroup className="mt-1">
				{!isCollapsed && (
					<p className="px-2 pb-1 font-semibold text-[10px] text-muted-foreground/70 uppercase tracking-[0.14em]">
						Navigation
					</p>
				)}
				<SidebarMenu>
					{routes.map((route) => {
						const isOpen = !isCollapsed && openCollapsible === route.id;
						const hasSubRoutes = !!route.subs?.length;
						const isActive = isRouteActive(route.link);

						return (
							<SidebarMenuItem key={route.id}>
								{hasSubRoutes ? (
									<Collapsible
										open={isOpen}
										onOpenChange={(open) =>
											setOpenCollapsible(open ? route.id : null)
										}
										className="w-full"
									>
										<CollapsibleTrigger
											render={(props) => (
												<AnimateIcon animateOnHover>
													<SidebarMenuButton
														{...props}
														className={cn(
															"group flex h-9 w-full items-center rounded-xl px-2 transition-all duration-200",
															isOpen
																? "bg-sidebar-muted/80 text-foreground"
																: isActive
																	? "bg-sidebar-accent text-foreground"
																	: "text-muted-foreground hover:bg-sidebar-muted/70 hover:text-foreground",
															isCollapsed && "justify-center",
														)}
													>
														{route.icon}
														{!isCollapsed && (
															<span className="ml-2 flex-1 font-medium text-sm">
																{route.title}
															</span>
														)}
														{!isCollapsed && hasSubRoutes && (
															<span className="ml-auto text-muted-foreground/70 transition-colors group-hover:text-foreground">
																{isOpen ? (
																	<ChevronUp className="size-4" />
																) : (
																	<ChevronDown className="size-4" />
																)}
															</span>
														)}
													</SidebarMenuButton>
												</AnimateIcon>
											)}
										/>

										{!isCollapsed && (
											<CollapsibleContent>
												<SidebarMenuSub className="my-1.5 ml-4 space-y-0.5 pl-1">
													{route.subs?.map((subRoute) => (
														<SidebarMenuSubItem
															key={`${route.id}-${subRoute.title}`}
															className="h-auto"
														>
															<SidebarMenuSubButton asChild>
																<Link
																	href={subRoute.link as Route}
																	prefetch={true}
																	className={cn(
																		"flex items-center rounded-lg px-3 py-1.5 font-medium text-sm transition-colors",
																		pathname?.startsWith(subRoute.link)
																			? "bg-sidebar-accent/80 text-foreground"
																			: "text-muted-foreground hover:bg-sidebar-muted/70 hover:text-foreground",
																	)}
																>
																	{subRoute.title}
																</Link>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</CollapsibleContent>
										)}
									</Collapsible>
								) : (
									<AnimateIcon animateOnHover>
										<SidebarMenuButton tooltip={route.title} asChild>
											<Link
												href={route.link as Route}
												prefetch={true}
												className={cn(
													"group flex h-9 items-center rounded-xl px-2 transition-all duration-200",
													isActive
														? "bg-sidebar-accent text-foreground"
														: "text-muted-foreground hover:bg-sidebar-muted/70 hover:text-foreground",
													isCollapsed && "justify-center",
												)}
											>
												{route.icon}
												{!isCollapsed && (
													<span className="ml-2 font-medium text-sm">
														{route.title}
													</span>
												)}
											</Link>
										</SidebarMenuButton>
									</AnimateIcon>
								)}
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroup>
		</SidebarContent>
	);
}
