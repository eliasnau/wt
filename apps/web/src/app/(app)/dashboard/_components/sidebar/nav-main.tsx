"use client";

import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuItem as SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

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

export default function DashboardNavigation({
	routes,
}: {
	routes: NavRoute[];
}) {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

	return (
		<SidebarMenu>
			{routes.map((route) => {
				const isOpen = !isCollapsed && openCollapsible === route.id;
				const hasSubRoutes = !!route.subs?.length;

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
													"flex w-full items-center rounded-lg px-2 transition-colors",
													isOpen
														? "bg-sidebar-muted text-foreground"
														: "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
													isCollapsed && "justify-center",
												)}
											>
												{route.icon}
												{!isCollapsed && (
													<span className="ml-2 flex-1 text-sm font-medium">
														{route.title}
													</span>
												)}
												{!isCollapsed && hasSubRoutes && (
													<span className="ml-auto">
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
										<SidebarMenuSub className="my-1 ml-3.5 ">
											{route.subs?.map((subRoute) => (
												<SidebarMenuSubItem
													key={`${route.id}-${subRoute.title}`}
													className="h-auto"
												>
													<SidebarMenuSubButton asChild>
														<Link
															href={subRoute.link as Route}
															prefetch={true}
															className="flex items-center rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
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
											"flex items-center rounded-lg px-2 transition-colors text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
											isCollapsed && "justify-center",
										)}
									>
										{route.icon}
										{!isCollapsed && (
											<span className="ml-2 text-sm font-medium">
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
	);
}
