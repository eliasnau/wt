"use client";

import { Building2, Shield } from "lucide-react";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { SlidersHorizontal } from "@/components/animate-ui/icons/sliders-horizontal";
import { User } from "@/components/animate-ui/icons/user";
import { SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavButton } from "./nav-button";

const routes = [
	{
		id: "general",
		title: "General",
		icon: <User className="size-4" />,
		href: "/account",
		exact: true,
	},
	{
		id: "customization",
		title: "Customization",
		icon: <SlidersHorizontal className="size-4" />,
		href: "/account/customization",
	},
	{
		id: "security",
		title: "Sicherheit",
		icon: <Shield className="size-4" />,
		href: "/account/security",
	},
	{
		id: "organizations",
		title: "Organizations",
		icon: <Building2 className="size-4" />,
		href: "/account/organizations",
	},
];

export function AccountSidebar() {
	return (
		<SidebarContent>
			<TooltipProvider delay={300}>
				{/* Back to Dashboard */}
				<SidebarGroup className="px-2 pt-6">
					<NavButton
						href="/dashboard"
						icon={<ChevronLeft className="size-4" />}
						title="Zurück zum Dashboard"
					/>
				</SidebarGroup>

				{/* Account nav */}
				<SidebarGroup className="gap-1 px-2">
					{routes.map((route) => (
						<NavButton
							key={route.id}
							href={route.href}
							icon={route.icon}
							title={route.title}
							exact={route.exact}
							layoutId="account-nav"
						/>
					))}
				</SidebarGroup>
			</TooltipProvider>
		</SidebarContent>
	);
}
