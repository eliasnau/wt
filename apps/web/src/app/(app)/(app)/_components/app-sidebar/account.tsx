"use client";

import { Building2, ChevronDown, ChevronUp, Shield } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { SlidersHorizontal } from "@/components/animate-ui/icons/sliders-horizontal";
import { User } from "@/components/animate-ui/icons/user";
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
		id: "general",
		title: "General",
		icon: <User className="size-4" />,
		link: "/account",
	},
	{
		id: "customization",
		title: "Customization",
		icon: <SlidersHorizontal className="size-4" />,
		link: "/account/customization",
	},
	{
		id: "security",
		title: "Sicherheit",
		icon: <Shield className="size-4" size={16} />,
		link: "/account/security",
	},
	{
		id: "organizations",
		title: "Organizations",
		icon: <Building2 className="size-4" size={16} />,
		link: "/account/organizations",
	},
];

export function AccountSidebar() {
	const { state } = useSidebar();
	const pathname = usePathname();
	const isCollapsed = state === "collapsed";
	const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
	const isRouteActive = (link: string) =>
		link === "/account"
			? pathname === "/account"
			: Boolean(pathname?.startsWith(link));

	return (
		<SidebarContent>
			<SidebarGroup>
				<SidebarMenuItem>
					<AnimateIcon animateOnHover>
						<SidebarMenuButton tooltip="Dashboard" asChild>
							<Link
								href={"/dashboard"}
								prefetch={true}
								className={cn(
									"group flex h-9 items-center rounded-xl px-2 text-muted-foreground transition-all duration-200 hover:bg-sidebar-muted/70 hover:text-foreground",
									isCollapsed && "justify-center",
								)}
								style={{
									// Center text "Dashboard" only, icon remains at start
									justifyContent: isCollapsed ? "center" : "start",
									width: "100%",
								}}
							>
								<ChevronLeft />
								{!isCollapsed && (
									<span className="ml-2 font-medium text-sm">
										Zurück zum Dashboard
									</span>
								)}
							</Link>
						</SidebarMenuButton>
					</AnimateIcon>
				</SidebarMenuItem>
			</SidebarGroup>
			<SidebarGroup className="mt-1">
				{!isCollapsed && (
					<p className="px-2 pb-1 font-semibold text-[10px] text-muted-foreground/70 uppercase tracking-[0.14em]">
						Account
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
